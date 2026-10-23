from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def classify_question_topics(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    rules = {
        "grammar": [
            ("conditionals", ("if ", "unless", "would have", "had been")),
            ("verb_tenses", ("yesterday", "since ", "for two years", "already", "while ", "last week", "tomorrow")),
            ("articles", (" a ", " an ", " the ")),
            ("prepositions", ("in the morning", "at the", "on the", "between", "under", "behind", "into")),
            ("modals", ("must ", "should ", "might ", "could ", "have to")),
            ("passive_voice", ("was built", "is made", "were written", "been done")),
        ],
        "vocabulary": [
            ("travel", ("airport", "train", "ticket", "journey", "hotel", "flight", "luggage")),
            ("work", ("office", "job", "meeting", "colleague", "salary", "company")),
            ("education", ("school", "student", "teacher", "lesson", "exam", "university")),
            ("food", ("food", "cook", "meal", "restaurant", "hungry", "bread", "fruit")),
            ("feelings", ("happy", "sad", "angry", "afraid", "excited", "nervous")),
            ("nature", ("weather", "forest", "river", "animal", "plant", "environment")),
        ],
        "reading": [
            ("main_idea", ("main idea", "best title", "main purpose", "mostly about")),
            ("detail", ("according to the text", "according to the passage", "mentioned in the text")),
            ("inference", ("infer", "suggests that", "probably", "implies")),
        ],
    }
    for question in Question.objects.all().iterator():
        text = " ".join([
            question.question_text or "", question.option_a or "", question.option_b or "",
            question.option_c or "", question.option_d or "",
        ]).lower()
        topic = question.quiz_type
        for candidate, keywords in rules.get(question.quiz_type, []):
            if any(keyword in text for keyword in keywords):
                topic = candidate
                break
        question.topic = topic
        question.save(update_fields=["topic"])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("quiz", "0007_question_difficulty"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="topic",
            field=models.CharField(blank=True, db_index=True, default="general", max_length=80),
        ),
        migrations.CreateModel(
            name="AdaptiveQuizProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("skill", models.CharField(choices=[("vocabulary", "Vocabulary"), ("grammar", "Grammar"), ("reading", "Reading")], max_length=20)),
                ("current_difficulty", models.CharField(choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")], default="medium", max_length=10)),
                ("correct_streak", models.PositiveSmallIntegerField(default=0)),
                ("wrong_streak", models.PositiveSmallIntegerField(default=0)),
                ("total_attempts", models.PositiveIntegerField(default=0)),
                ("total_correct", models.PositiveIntegerField(default=0)),
                ("focus_topic", models.CharField(blank=True, default="", max_length=80)),
                ("topic_mistakes", models.JSONField(blank=True, default=dict)),
                ("recent_question_ids", models.JSONField(blank=True, default=list)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="adaptive_quiz_progress", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "constraints": [models.UniqueConstraint(fields=("user", "skill"), name="unique_adaptive_progress_per_skill")],
            },
        ),
        migrations.RunPython(classify_question_topics, migrations.RunPython.noop),
    ]

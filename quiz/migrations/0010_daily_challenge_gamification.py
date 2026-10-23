# Generated for daily challenges and learner gamification.
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("quiz", "0009_question_learning_feedback"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserGamification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("total_xp", models.PositiveIntegerField(default=0)),
                ("current_streak", models.PositiveIntegerField(default=0)),
                ("longest_streak", models.PositiveIntegerField(default=0)),
                ("last_activity_date", models.DateField(blank=True, null=True)),
                ("grammar_correct", models.PositiveIntegerField(default=0)),
                ("vocabulary_correct", models.PositiveIntegerField(default=0)),
                ("badges", models.JSONField(blank=True, default=list)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="gamification", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="DailyChallengeAttempt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("challenge_date", models.DateField()),
                ("question_ids", models.JSONField(default=list)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("correct_answers", models.PositiveSmallIntegerField(default=0)),
                ("total_questions", models.PositiveSmallIntegerField(default=10)),
                ("xp_awarded", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="daily_challenges", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-challenge_date",)},
        ),
        migrations.AddConstraint(
            model_name="dailychallengeattempt",
            constraint=models.UniqueConstraint(fields=("user", "challenge_date"), name="unique_daily_challenge_per_user_day"),
        ),
    ]

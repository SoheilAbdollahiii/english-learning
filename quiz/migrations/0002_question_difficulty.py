from django.db import migrations, models


def assign_initial_difficulty(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    Question.objects.filter(level="A1").update(difficulty="easy")
    Question.objects.filter(level="B1").update(difficulty="medium")
    Question.objects.filter(level="C1").update(difficulty="hard")


def reset_difficulty(apps, schema_editor):
    apps.get_model("quiz", "Question").objects.update(difficulty="medium")


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="difficulty",
            field=models.CharField(
                choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")],
                db_index=True,
                default="medium",
                max_length=10,
            ),
        ),
        migrations.RunPython(assign_initial_difficulty, reset_difficulty),
    ]

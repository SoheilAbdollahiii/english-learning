from django.db import migrations, models


def assign_initial_difficulty(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    # CEFR level provides only an initial estimate. Editors can refine each
    # question's difficulty independently in Django admin.
    Question.objects.filter(level__in=["A1", "A2"]).update(difficulty="easy")
    Question.objects.filter(level__in=["B1", "B2"]).update(difficulty="medium")
    Question.objects.filter(level__in=["C1", "C2"]).update(difficulty="hard")


def reset_difficulty(apps, schema_editor):
    apps.get_model("quiz", "Question").objects.update(difficulty="medium")


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0006_expand_cefr_levels"),
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

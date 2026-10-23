from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0008_adaptive_quiz_progress"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="example_sentence",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="question",
            name="example_translation",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="question",
            name="common_mistake",
            field=models.TextField(blank=True, default=""),
        ),
    ]

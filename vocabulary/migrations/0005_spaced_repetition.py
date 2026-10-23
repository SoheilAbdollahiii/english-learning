import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vocabulary", "0004_seed_curated_words"),
    ]

    operations = [
        migrations.AddField(
            model_name="userword",
            name="next_review_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name="userword",
            name="last_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="userword",
            name="review_interval_days",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="userword",
            name="review_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="userword",
            name="correct_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="userword",
            name="incorrect_count",
            field=models.PositiveIntegerField(default=0),
        ),
    ]

# Store per-attempt performance details for learner analytics.
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0010_daily_challenge_gamification"),
    ]

    operations = [
        migrations.AddField(
            model_name="quizsession",
            name="duration_seconds",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="quizsession",
            name="topic_breakdown",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="quizsession",
            name="mistake_patterns",
            field=models.JSONField(blank=True, default=list),
        ),
    ]

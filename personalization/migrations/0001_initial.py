from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="LearningPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("preferred_level", models.CharField(choices=[("A1", "Beginner"), ("B1", "Intermediate"), ("C1", "Advanced")], default="B1", max_length=2)),
                ("daily_word_goal", models.PositiveSmallIntegerField(default=10)),
                ("learning_goal", models.CharField(choices=[("general", "General English"), ("travel", "Travel"), ("work", "Work"), ("exam", "Exam preparation")], default="general", max_length=12)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="learning_preference", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

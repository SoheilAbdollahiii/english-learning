from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("vocabulary", "0002_word_proficiency"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserWord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("english_word", models.CharField(max_length=100)),
                ("translation", models.CharField(blank=True, default="", max_length=100)),
                ("level", models.CharField(choices=[("A1", "Beginner"), ("B1", "Intermediate"), ("C1", "Advanced")], default="B1", max_length=2)),
                ("proficiency", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_words", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["english_word"]},
        ),
        migrations.AddConstraint(
            model_name="userword",
            constraint=models.UniqueConstraint(fields=("user", "english_word"), name="unique_saved_word_per_user"),
        ),
    ]

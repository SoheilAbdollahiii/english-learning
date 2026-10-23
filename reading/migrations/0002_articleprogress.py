from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("reading", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ArticleProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("completed", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("article", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learner_progress", to="reading.article")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="article_progress", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.AddConstraint(
            model_name="articleprogress",
            constraint=models.UniqueConstraint(fields=("user", "article"), name="unique_article_progress_per_user"),
        ),
    ]

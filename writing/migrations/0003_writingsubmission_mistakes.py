from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("writing", "0002_nullable_unavailable_score"),
    ]

    operations = [
        migrations.AddField(
            model_name="writingsubmission",
            name="mistakes",
            field=models.JSONField(blank=True, default=list),
        ),
    ]

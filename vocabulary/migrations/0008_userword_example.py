from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vocabulary", "0007_expand_curated_vocabulary"),
    ]

    operations = [
        migrations.AddField(
            model_name="userword",
            name="example",
            field=models.CharField(blank=True, default="", max_length=400),
        ),
    ]

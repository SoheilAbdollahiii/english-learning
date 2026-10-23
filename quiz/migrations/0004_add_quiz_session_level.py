from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("quiz", "0003_expand_levelled_quizzes")]

    operations = [
        migrations.AddField(
            model_name="quizsession",
            name="level",
            field=models.CharField(default="B1", max_length=10),
        ),
    ]

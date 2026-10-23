"""Represent unavailable AI scores as NULL instead of a misleading zero."""

from django.db import migrations, models
from django.db.models import Q


def clear_scores_without_corrections(apps, schema_editor):
    WritingSubmission = apps.get_model("writing", "WritingSubmission")
    WritingSubmission.objects.filter(
        Q(corrected_text="") | Q(corrected_text__isnull=True)
    ).update(score=None)


class Migration(migrations.Migration):
    dependencies = [("writing", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="writingsubmission",
            name="score",
            field=models.IntegerField(blank=True, null=True, default=None),
        ),
        migrations.RunPython(clear_scores_without_corrections, migrations.RunPython.noop),
    ]

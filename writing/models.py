from django.db import models
from django.contrib.auth.models import User


class WritingSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    original_text = models.TextField()
    corrected_text = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    score = models.IntegerField(blank=True, null=True, default=None)
    # Structured, actionable mistakes returned by the correction service.
    # Legacy submissions remain null; new analyses store a list, even when empty.
    mistakes = models.JSONField(null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d')}"

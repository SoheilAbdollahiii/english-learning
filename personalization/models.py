from django.conf import settings
from django.db import models


class LearningPreference(models.Model):
    LEVEL_CHOICES = [("A1", "Beginner"), ("B1", "Intermediate"), ("C1", "Advanced")]
    GOAL_CHOICES = [
        ("general", "General English"),
        ("travel", "Travel"),
        ("work", "Work"),
        ("exam", "Exam preparation"),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learning_preference")
    preferred_level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default="B1")
    daily_word_goal = models.PositiveSmallIntegerField(default=10)
    learning_goal = models.CharField(max_length=12, choices=GOAL_CHOICES, default="general")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Learning preferences for {self.user}"

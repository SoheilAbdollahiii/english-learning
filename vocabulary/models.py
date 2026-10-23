from django.conf import settings
from django.db import models


class Word(models.Model):
    LEVEL_CHOICES = [
        ("A1", "Beginner"),
        ("B1", "Intermediate"),
        ("C1", "Advanced"),
    ]
    english_word = models.CharField(max_length=100)
    translation = models.CharField(max_length=100)
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default="A1")
    proficiency = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.english_word} ({self.level})"


class UserWord(models.Model):
    LEVEL_CHOICES = Word.LEVEL_CHOICES

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_words")
    english_word = models.CharField(max_length=100)
    translation = models.CharField(max_length=100, blank=True, default="")
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default="B1")
    proficiency = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["english_word"]
        constraints = [
            models.UniqueConstraint(fields=["user", "english_word"], name="unique_saved_word_per_user")
        ]

    def __str__(self):
        return f"{self.english_word} ({self.user})"

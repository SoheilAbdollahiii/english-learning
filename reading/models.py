from django.conf import settings
from django.db import models


class Article(models.Model):
    LEVEL_CHOICES = [
        ("A1", "Beginner"),
        ("B1", "Intermediate"),
        ("C1", "Advanced"),
    ]
    title = models.CharField(max_length=200)
    content = models.TextField()
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default="A1")

    def __str__(self):
        return f"{self.title} - Level {self.level}"


class ArticleProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="article_progress")
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="learner_progress")
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "article"], name="unique_article_progress_per_user")
        ]

    def __str__(self):
        return f"{self.user} - {self.article} ({'read' if self.completed else 'in progress'})"

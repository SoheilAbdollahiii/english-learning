from django.db import models

class Article(models.Model):
    LEVEL_CHOICES = [
        ('A1', 'Beginner'),
        ('B1', 'Intermediate'),
        ('C1', 'Advanced'),
    ]
    title = models.CharField(max_length=200)
    content = models.TextField()
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default='A1')

    def __str__(self):
        return f"{self.title} - Level {self.level}"
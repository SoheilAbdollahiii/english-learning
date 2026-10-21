from django.db import models

class Word(models.Model):
    LEVEL_CHOICES = [
        ('A1', 'Beginner'),
        ('B1', 'Intermediate'),
        ('C1', 'Advanced'),
    ]
    english_word = models.CharField(max_length=100)
    translation = models.CharField(max_length=100)
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default='A1')

    def __str__(self):
        return f"{self.english_word} ({self.level})"
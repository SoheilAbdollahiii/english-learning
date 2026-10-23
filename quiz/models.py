from django.db import models
from django.contrib.auth.models import User

class QuizSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz_type = models.CharField(max_length=50, default='vocabulary') # نوع کوییز مثل vocabulary یا reading
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.quiz_type} - {self.score}/{self.total_questions}"


class Question(models.Model):
    quiz_type = models.CharField(max_length=50, default='vocabulary')
    question_text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1) # مقادیر مثل 'A', 'B', 'C', 'D'
    explanation = models.TextField(blank=True, null=True) # توضیح آموزشی بعد از پاسخ
    level = models.CharField(max_length=10, default='B1')

    def __str__(self):
        return f"[{self.quiz_type}] {self.question_text[:50]}"
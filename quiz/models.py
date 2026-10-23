from django.db import models
from django.contrib.auth.models import User

class QuizSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz_type = models.CharField(max_length=50, default='vocabulary') # نوع کوییز مثل vocabulary یا reading
    level = models.CharField(max_length=10, default='B1')
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    topic_breakdown = models.JSONField(default=dict, blank=True)
    mistake_patterns = models.JSONField(default=list, blank=True)
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
    difficulty = models.CharField(max_length=10, choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', db_index=True)
    topic = models.CharField(max_length=80, blank=True, default="general", db_index=True)
    example_sentence = models.TextField(blank=True, default="")
    example_translation = models.TextField(blank=True, default="")
    common_mistake = models.TextField(blank=True, default="")

    def __str__(self):
        return f"[{self.quiz_type}] {self.question_text[:50]}"

class AdaptiveQuizProgress(models.Model):
    """Independent adaptive state for each learner and quiz skill."""
    DIFFICULTY_CHOICES = Question._meta.get_field("difficulty").choices
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="adaptive_quiz_progress")
    skill = models.CharField(max_length=20, choices=[
        ("vocabulary", "Vocabulary"), ("grammar", "Grammar"), ("reading", "Reading")
    ])
    current_difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    correct_streak = models.PositiveSmallIntegerField(default=0)
    wrong_streak = models.PositiveSmallIntegerField(default=0)
    total_attempts = models.PositiveIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)
    focus_topic = models.CharField(max_length=80, blank=True, default="")
    topic_mistakes = models.JSONField(default=dict, blank=True)
    recent_question_ids = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "skill"), name="unique_adaptive_progress_per_skill")
        ]

    @property
    def accuracy(self):
        if not self.total_attempts:
            return 0
        return round(self.total_correct * 100 / self.total_attempts)

    def __str__(self):
        return f"{self.user.username} - {self.skill} - {self.current_difficulty}"


class UserGamification(models.Model):
    """XP, streak and achievement state owned by a single learner."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="gamification")
    total_xp = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(blank=True, null=True)
    grammar_correct = models.PositiveIntegerField(default=0)
    vocabulary_correct = models.PositiveIntegerField(default=0)
    badges = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.total_xp} XP"


class DailyChallengeAttempt(models.Model):
    """One immutable question set and one reward claim per learner per local day."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="daily_challenges")
    challenge_date = models.DateField()
    question_ids = models.JSONField(default=list)
    completed_at = models.DateTimeField(blank=True, null=True)
    correct_answers = models.PositiveSmallIntegerField(default=0)
    total_questions = models.PositiveSmallIntegerField(default=10)
    xp_awarded = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "challenge_date"), name="unique_daily_challenge_per_user_day")
        ]
        ordering = ("-challenge_date",)

    @property
    def is_completed(self):
        return self.completed_at is not None

    def __str__(self):
        return f"{self.user.username} - {self.challenge_date}"

from django.contrib import admin
from .models import DailyChallengeAttempt, Question, QuizSession, UserGamification


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("question_text", "quiz_type", "level", "topic", "difficulty", "correct_option")
    list_filter = ("quiz_type", "level", "topic", "difficulty")
    search_fields = ("question_text", "explanation", "example_sentence", "common_mistake")
    fieldsets = (
        ("Question", {"fields": ("quiz_type", "level", "difficulty", "topic", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_option")}),
        ("Teaching feedback", {"fields": ("explanation", "example_sentence", "example_translation", "common_mistake")}),
    )


@admin.register(QuizSession)
class QuizSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz_type", "score", "total_questions", "created_at")
    list_filter = ("quiz_type", "created_at")
    search_fields = ("user__username",)


@admin.register(UserGamification)
class UserGamificationAdmin(admin.ModelAdmin):
    list_display = ("user", "total_xp", "current_streak", "longest_streak", "last_activity_date")
    search_fields = ("user__username",)
    readonly_fields = ("updated_at",)


@admin.register(DailyChallengeAttempt)
class DailyChallengeAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "challenge_date", "completed_at", "correct_answers", "total_questions", "xp_awarded")
    list_filter = ("challenge_date", "completed_at")
    search_fields = ("user__username",)
    readonly_fields = ("created_at",)

from django.contrib import admin
from .models import Question, QuizSession


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

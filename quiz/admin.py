from django.contrib import admin
from .models import Question, QuizSession


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("question_text", "quiz_type", "level", "difficulty", "correct_option")
    list_filter = ("quiz_type", "level", "difficulty")
    search_fields = ("question_text",)


@admin.register(QuizSession)
class QuizSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz_type", "score", "total_questions", "created_at")
    list_filter = ("quiz_type", "created_at")
    search_fields = ("user__username",)

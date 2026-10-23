from django.urls import path
from . import views

urlpatterns = [
    path("api/questions/", views.get_quiz_questions, name="quiz_questions"),
    path("api/adaptive/next/", views.get_adaptive_quiz_question, name="adaptive_quiz_next"),
    path("api/adaptive/progress/", views.adaptive_quiz_progress, name="adaptive_quiz_progress"),
    path("api/submit/", views.submit_quiz, name="quiz_submit"),
    path("api/check-answer/", views.check_quiz_answer, name="quiz_check_answer"),
    path("api/history/", views.quiz_history, name="quiz_history"),
    path("api/stats/", views.quiz_stats, name="quiz_stats"),
    path("api/daily-challenge/", views.daily_challenge, name="daily_challenge"),
    path("api/daily-challenge/submit/", views.submit_daily_challenge, name="submit_daily_challenge"),
    path("api/gamification/", views.gamification_status, name="gamification_status"),
]

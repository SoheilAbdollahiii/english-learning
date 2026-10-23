from django.urls import path
from . import views

urlpatterns = [
    path("api/questions/", views.get_quiz_questions, name="quiz_questions"),
    path("api/submit/", views.submit_quiz, name="quiz_submit"),
    path("api/history/", views.quiz_history, name="quiz_history"),
    path("api/stats/", views.quiz_stats, name="quiz_stats"),
]

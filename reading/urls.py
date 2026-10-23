from django.urls import path
from . import views

urlpatterns = [
    path("api/articles/", views.get_articles, name="api_articles"),
    path("api/stories/", views.get_interactive_stories, name="interactive_stories"),
    path("api/stories/check-answer/", views.check_interactive_story_answer, name="interactive_story_check_answer"),
    path("api/progress/", views.article_progress, name="article_progress"),
]

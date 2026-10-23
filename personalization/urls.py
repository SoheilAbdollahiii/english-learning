from django.urls import path
from .views import learning_preferences

urlpatterns = [
    path("api/preferences/", learning_preferences, name="learning_preferences"),
]

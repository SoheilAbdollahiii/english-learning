from django.urls import path
from . import views

urlpatterns = [
    path('api/words/', views.get_words, name='api_words'),
]
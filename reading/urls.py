from django.urls import path
from . import views

urlpatterns = [
    path('api/articles/', views.get_articles, name='api_articles'),
]
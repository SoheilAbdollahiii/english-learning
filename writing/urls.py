from django.urls import path
from . import views

urlpatterns = [
    path('api/writings/', views.manage_writings, name='api_writings'),
]
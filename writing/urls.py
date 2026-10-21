from django.urls import path
from . import views

urlpatterns = [
    path('', views.submit_text, name='writing_submit'),
]
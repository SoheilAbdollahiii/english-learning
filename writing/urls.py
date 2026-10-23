from django.urls import path

from . import views

urlpatterns = [
    path("", views.writing_submit, name="writing_submit"),
    path("api/writings/", views.manage_writings, name="api_writings"),
]

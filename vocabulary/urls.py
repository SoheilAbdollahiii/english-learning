from django.urls import path
from . import views

urlpatterns = [
    path("api/words/", views.manage_words, name="api_words"),
    path("api/curated-words/", views.get_words, name="curated_words"),
    path("api/my-words/", views.my_words, name="my_words"),
    path("api/my-words/<int:word_id>/", views.my_word_detail, name="my_word_detail"),
    path("api/my-words/<int:word_id>/practice/", views.practice_word, name="practice_word"),
    path("api/review/queue/", views.review_queue, name="review_queue"),
    path("api/my-words/<int:word_id>/review/", views.review_word, name="review_word"),
]

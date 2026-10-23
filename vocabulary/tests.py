from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Word


User = get_user_model()


class SharedVocabularyPermissionsTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="learner", password="Strong-test-pass-123")
        self.staff = User.objects.create_user(
            username="staff",
            password="Strong-test-pass-123",
            is_staff=True,
        )
        self.url = reverse("api_words")
        self.client = APIClient()

    def test_vocabulary_api_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_authenticated_learner_can_read_shared_words(self):
        Word.objects.create(english_word="curious", translation="کنجکاو", level="A1")
        self.client.force_authenticate(user=self.learner)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["english_word"], "curious")

    def test_regular_learner_cannot_create_shared_words(self):
        self.client.force_authenticate(user=self.learner)
        response = self.client.post(
            self.url,
            {"english_word": "curious", "translation": "کنجکاو", "level": "A1"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Word.objects.count(), 0)

    def test_staff_can_create_shared_words(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            self.url,
            {"english_word": "curious", "translation": "کنجکاو", "level": "A1"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Word.objects.count(), 1)

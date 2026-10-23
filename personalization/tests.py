from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import LearningPreference


User = get_user_model()


class LearningPreferenceTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="student", password="Strong-test-pass-123")
        self.other = User.objects.create_user(username="another-student", password="Strong-test-pass-123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.learner)
        self.url = reverse("learning_preferences")

    def test_preferences_are_created_with_defaults_and_saved(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["preferred_level"], "B1")
        updated = self.client.patch(self.url, {"preferred_level": "C1", "daily_word_goal": 20, "learning_goal": "exam"}, format="json")
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["preferred_level"], "C1")
        self.assertEqual(LearningPreference.objects.filter(user=self.learner).count(), 1)

    def test_daily_goal_is_validated(self):
        response = self.client.patch(self.url, {"daily_word_goal": 0}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_preferences_require_authentication(self):
        response = APIClient().get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_preferences_are_user_specific(self):
        self.client.patch(self.url, {"preferred_level": "A1"}, format="json")
        self.client.force_authenticate(user=self.other)
        response = self.client.get(self.url)
        self.assertEqual(response.data["preferred_level"], "B1")

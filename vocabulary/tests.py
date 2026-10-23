from django.contrib.auth import get_user_model
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient

from .models import UserWord, Word


User = get_user_model()


class SharedVocabularyPermissionsTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="learner", password="Strong-test-pass-123")
        self.staff = User.objects.create_user(username="staff", password="Strong-test-pass-123", is_staff=True)
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
        self.assertIn("curious", [row["english_word"] for row in response.data])

    def test_regular_learner_cannot_create_shared_words(self):
        self.client.force_authenticate(user=self.learner)
        response = self.client.post(self.url, {"english_word": "unauthorizedword", "translation": "واژه", "level": "A1"}, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Word.objects.filter(english_word="unauthorizedword").exists())

    def test_staff_can_create_shared_words(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(self.url, {"english_word": "staffword", "translation": "واژه", "level": "A1"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Word.objects.filter(english_word="staffword").count(), 1)


class PersonalVocabularyTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="learner", password="Strong-test-pass-123")
        self.other = User.objects.create_user(username="other", password="Strong-test-pass-123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.learner)
        self.url = reverse("my_words")

    def test_learner_can_save_and_list_a_private_word(self):
        response = self.client.post(self.url, {"english_word": "resilient", "translation": "تاب‌آور", "level": "B1"}, format="json")
        self.assertEqual(response.status_code, 201)
        listing = self.client.get(self.url)
        self.assertEqual([row["english_word"] for row in listing.data], ["resilient"])
        self.assertEqual(UserWord.objects.filter(user=self.other).count(), 0)

    def test_duplicate_word_is_not_created_twice(self):
        first = self.client.post(self.url, {"english_word": "resilient"}, format="json")
        second = self.client.post(self.url, {"english_word": "RESILIENT"}, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(UserWord.objects.filter(user=self.learner).count(), 1)

    def test_practice_increases_mastery_and_never_exceeds_100(self):
        word = UserWord.objects.create(user=self.learner, english_word="resilient", proficiency=90)
        response = self.client.post(reverse("practice_word", args=[word.id]), {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["proficiency"], 100)

    def test_review_queue_is_private_and_only_contains_due_words(self):
        due = UserWord.objects.create(user=self.learner, english_word="due-word")
        future = UserWord.objects.create(
            user=self.learner,
            english_word="future-word",
            next_review_at=timezone.now() + timedelta(days=2),
        )
        UserWord.objects.create(user=self.other, english_word="other-user-word")

        response = self.client.get(reverse("review_queue"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual([item["id"] for item in response.data["results"]], [due.id])
        self.assertNotIn(future.id, [item["id"] for item in response.data["results"]])

    def test_successful_recall_increases_mastery_and_schedules_next_review(self):
        word = UserWord.objects.create(user=self.learner, english_word="resilient", proficiency=50)
        response = self.client.post(
            reverse("review_word", args=[word.id]), {"remembered": True}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["proficiency"], 60)
        self.assertEqual(response.data["review_count"], 1)
        self.assertEqual(response.data["correct_count"], 1)
        self.assertEqual(response.data["review_interval_days"], 1)
        word.refresh_from_db()
        self.assertGreater(word.next_review_at, timezone.now() + timedelta(hours=23))

    def test_failed_recall_reschedules_soon_and_reduces_mastery(self):
        word = UserWord.objects.create(user=self.learner, english_word="forgetful", proficiency=5)
        response = self.client.post(
            reverse("review_word", args=[word.id]), {"remembered": False}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["proficiency"], 0)
        self.assertEqual(response.data["incorrect_count"], 1)
        self.assertEqual(response.data["review_interval_days"], 0)
        word.refresh_from_db()
        self.assertGreater(word.next_review_at, timezone.now() + timedelta(minutes=9))

    def test_review_rejects_non_boolean_answer_and_other_users_word(self):
        word = UserWord.objects.create(user=self.other, english_word="private")
        response = self.client.post(
            reverse("review_word", args=[word.id]), {"remembered": "yes"}, format="json"
        )
        self.assertEqual(response.status_code, 404)
        own = UserWord.objects.create(user=self.learner, english_word="own-word")
        invalid = self.client.post(
            reverse("review_word", args=[own.id]), {"remembered": "yes"}, format="json"
        )
        self.assertEqual(invalid.status_code, 400)

    def test_user_cannot_edit_another_users_word(self):
        word = UserWord.objects.create(user=self.other, english_word="private")
        response = self.client.patch(reverse("my_word_detail", args=[word.id]), {"translation": "secret"}, format="json")
        self.assertEqual(response.status_code, 404)

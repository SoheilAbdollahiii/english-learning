from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Article, ArticleProgress


User = get_user_model()


class ReadingProgressTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="reader", password="Strong-test-pass-123")
        self.other = User.objects.create_user(username="other-reader", password="Strong-test-pass-123")
        self.article = Article.objects.create(title="A useful habit", content="Read a little every day.", level="A1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.learner)

    def test_reading_library_has_articles_for_all_levels(self):
        self.assertGreaterEqual(Article.objects.count(), 15)
        for level in ("A1", "B1", "C1"):
            self.assertTrue(Article.objects.filter(level=level).exists(), f"Missing reading level {level}")

    def test_articles_can_be_searched_and_filtered_by_level(self):
        Article.objects.create(title="Advanced text", content="A more difficult text.", level="C1")
        response = self.client.get(reverse("api_articles"), {"level": "A1", "q": "habit"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.article.id])

    def test_reading_progress_is_saved_per_user(self):
        response = self.client.post(reverse("article_progress"), {"article_id": self.article.id, "completed": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["completed"])
        self.assertEqual(ArticleProgress.objects.filter(user=self.learner).count(), 1)
        self.assertEqual(ArticleProgress.objects.filter(user=self.other).count(), 0)

    def test_progress_can_be_marked_unread(self):
        ArticleProgress.objects.create(user=self.learner, article=self.article, completed=True)
        response = self.client.post(reverse("article_progress"), {"article_id": self.article.id, "completed": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["completed"])
        self.assertEqual(ArticleProgress.objects.filter(user=self.learner).count(), 1)

    def test_progress_requires_authentication(self):
        client = APIClient()
        response = client.get(reverse("article_progress"))
        self.assertEqual(response.status_code, 401)

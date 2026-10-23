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
        self.assertGreaterEqual(Article.objects.count(), 24, "Expanded reading library should be installed by migrations")
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

    def test_invalid_article_ids_return_bad_request(self):
        for article_id in ("not-an-id", "", 0, -1, True, 1.5):
            with self.subTest(article_id=article_id):
                response = self.client.post(
                    reverse("article_progress"),
                    {"article_id": article_id, "completed": True},
                    format="json",
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn("article_id", response.data)

    def test_unknown_article_id_returns_not_found(self):
        response = self.client.post(
            reverse("article_progress"),
            {"article_id": 999999, "completed": True},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_progress_requires_authentication(self):
        client = APIClient()
        response = client.get(reverse("article_progress"))
        self.assertEqual(response.status_code, 401)


class InteractiveStoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_story_library_contains_multiple_genres_and_branching_endings(self):
        response = self.client.get(reverse("interactive_stories"))
        self.assertEqual(response.status_code, 200)
        stories = response.data
        self.assertGreaterEqual(len(stories), 3)
        self.assertEqual({story["genre"] for story in stories}, {"mystery", "adventure", "everyday"})
        for story in stories:
            self.assertIn(story["start_node"], story["nodes"])
            endings = {node_id for node_id, node in story["nodes"].items() if node.get("ending")}
            self.assertGreaterEqual(len(endings), 2)
            for node in story["nodes"].values():
                question = node.get("question")
                if question:
                    self.assertNotIn("correct_option", question)
                    self.assertEqual(len(question["options"]), 4)
                for choice in node.get("choices", []):
                    self.assertIn(choice["next_node"], story["nodes"])

    def test_story_answer_is_checked_server_side(self):
        response = self.client.post(
            reverse("interactive_story_check_answer"),
            {"story_id": "forest-signal", "node_id": "trail", "option_index": 1},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["correct"])
        self.assertIn("green light", response.data["explanation"].lower())

        incorrect = self.client.post(
            reverse("interactive_story_check_answer"),
            {"story_id": "forest-signal", "node_id": "trail", "option_index": 0},
            format="json",
        )
        self.assertEqual(incorrect.status_code, 200)
        self.assertFalse(incorrect.data["correct"])
        self.assertTrue(incorrect.data["explanation"])

    def test_story_answer_endpoint_rejects_invalid_input_and_unknown_questions(self):
        endpoint = reverse("interactive_story_check_answer")
        for payload in (
            {"story_id": "forest-signal", "node_id": "trail", "option_index": True},
            {"story_id": "forest-signal", "node_id": "trail", "option_index": "1"},
            {"story_id": "forest-signal", "node_id": "trail", "option_index": 99},
        ):
            with self.subTest(payload=payload):
                response = self.client.post(endpoint, payload, format="json")
                self.assertEqual(response.status_code, 400)
        missing_story = self.client.post(
            endpoint, {"story_id": "unknown", "node_id": "trail", "option_index": 0}, format="json"
        )
        self.assertEqual(missing_story.status_code, 404)
        missing_question = self.client.post(
            endpoint, {"story_id": "forest-signal", "node_id": "ending-rescue", "option_index": 0}, format="json"
        )
        self.assertEqual(missing_question.status_code, 404)

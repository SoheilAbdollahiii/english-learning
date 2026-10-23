from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from .models import Question, QuizSession


User = get_user_model()


class LearningQuizTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(username="quiz-learner", password="Strong-test-pass-123")
        self.other = User.objects.create_user(username="other-learner", password="Strong-test-pass-123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.learner)

    def test_seeded_quizzes_exist_for_all_three_skills(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            response = self.client.get(reverse("quiz_questions"), {"type": quiz_type})
            self.assertEqual(response.status_code, 200)
            self.assertGreaterEqual(len(response.data), 1)
            self.assertNotIn("correct_option", response.data[0])

    def test_each_quiz_type_has_five_questions_at_every_supported_level(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            for level in ("A1", "B1", "C1"):
                response = self.client.get(reverse("quiz_questions"), {"type": quiz_type, "level": level})
                self.assertEqual(response.status_code, 200, f"Missing {quiz_type} content at {level}")
                self.assertEqual(len(response.data), 5)
                self.assertTrue(all(item["level"] == level for item in response.data))
                self.assertNotIn("correct_option", response.data[0])

    def test_invalid_quiz_type_is_rejected(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "made-up"})
        self.assertEqual(response.status_code, 400)

    def test_invalid_quiz_level_is_rejected(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "grammar", "level": "D2"})
        self.assertEqual(response.status_code, 400)

    def test_submitting_quiz_saves_result_and_history_is_private(self):
        question = Question.objects.filter(quiz_type="grammar").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "grammar", "level": question.level, "answers": {str(question.id): question.correct_option}},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["score"], 1)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["level"], question.level)
        self.assertEqual(QuizSession.objects.filter(user=self.learner).count(), 1)
        self.assertEqual(QuizSession.objects.get(user=self.learner).level, question.level)
        history = self.client.get(reverse("quiz_history"))
        self.assertEqual(len(history.data), 1)
        self.assertEqual(history.data[0]["quiz_type"], "grammar")
        self.assertEqual(history.data[0]["level"], question.level)
        self.client.force_authenticate(user=self.other)
        self.assertEqual(len(self.client.get(reverse("quiz_history")).data), 0)

    def test_cannot_submit_question_from_another_quiz_type(self):
        question = Question.objects.filter(quiz_type="reading").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "vocabulary", "answers": {str(question.id): "A"}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(QuizSession.objects.count(), 0)

    def test_submission_rejects_questions_from_a_different_level(self):
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "grammar", "level": "B1", "answers": {str(question.id): question.correct_option}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(QuizSession.objects.count(), 0)

    def test_empty_answers_are_rejected(self):
        response = self.client.post(reverse("quiz_submit"), {"quiz_type": "reading", "answers": {}}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_stats_calculate_real_streak_and_are_private(self):
        today_session = QuizSession.objects.create(
            user=self.learner, quiz_type="grammar", score=1, total_questions=1
        )
        yesterday_session = QuizSession.objects.create(
            user=self.learner, quiz_type="reading", score=1, total_questions=1
        )
        yesterday_session.created_at = timezone.now() - timedelta(days=1)
        yesterday_session.save(update_fields=["created_at"])
        QuizSession.objects.create(
            user=self.other, quiz_type="vocabulary", score=1, total_questions=1
        )

        response = self.client.get(reverse("quiz_stats"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["current_streak"], 2)
        self.assertEqual(response.data["quiz_sessions_total"], 2)
        self.assertEqual(response.data["daily_activity"][-1]["count"], 1)

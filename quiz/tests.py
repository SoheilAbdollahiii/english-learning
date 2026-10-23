from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
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
            self.assertGreaterEqual(len(response.data), 5)
            self.assertNotIn("correct_option", response.data[0])

    def test_each_quiz_type_has_five_questions_at_every_supported_level(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            for level in ("A1", "B1", "C1"):
                response = self.client.get(reverse("quiz_questions"), {"type": quiz_type, "level": level})
                self.assertEqual(response.status_code, 200, f"Missing {quiz_type} content at {level}")
                self.assertEqual(len(response.data), 5)
                self.assertGreaterEqual(Question.objects.filter(quiz_type=quiz_type, level=level).count(), 8, f"Expanded question bank is missing items for {quiz_type}/{level}")
                self.assertTrue(all(item["level"] == level for item in response.data))
                self.assertNotIn("correct_option", response.data[0])

    def test_correct_answer_positions_are_not_identical_within_each_bank(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            for level in ("A1", "B1", "C1"):
                positions = set(
                    Question.objects.filter(quiz_type=quiz_type, level=level).values_list("correct_option", flat=True)
                )
                self.assertGreaterEqual(len(positions), 2, f"Answer positions are too predictable for {quiz_type}/{level}")

    def test_correct_answer_positions_are_not_biased_to_one_letter(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            for level in ("A1", "B1", "C1"):
                keys = set(Question.objects.filter(quiz_type=quiz_type, level=level).values_list("correct_option", flat=True))
                self.assertGreaterEqual(len(keys), 2, f"Answer positions are too predictable for {quiz_type} {level}")

    def test_invalid_quiz_type_is_rejected(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "made-up"})
        self.assertEqual(response.status_code, 400)

    def test_question_count_can_be_configured_and_is_bounded(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "grammar", "level": "A1", "count": 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        for count in ("0", "31", "not-a-number"):
            invalid = self.client.get(reverse("quiz_questions"), {"type": "grammar", "level": "A1", "count": count})
            self.assertEqual(invalid.status_code, 400, count)

    def test_all_level_filter_can_return_questions_from_supported_levels(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "grammar", "level": "all", "count": 20})
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 5)
        self.assertTrue({item["level"] for item in response.data}.issubset({"A1", "A2", "B1", "B2", "C1", "C2"}))

    def test_mixed_quiz_and_difficulty_filters_work(self):
        response = self.client.get(reverse("quiz_questions"), {
            "type": "mixed", "level": "all", "difficulty": "easy", "count": 30,
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data)
        self.assertTrue(all(item["difficulty"] == "easy" for item in response.data))
        self.assertTrue({item["quiz_type"] for item in response.data}.issubset({"vocabulary", "reading", "grammar"}))

        invalid = self.client.get(reverse("quiz_questions"), {"type": "grammar", "difficulty": "expert"})
        self.assertEqual(invalid.status_code, 400)

    def test_shuffle_can_be_disabled_for_stable_question_order(self):
        response = self.client.get(reverse("quiz_questions"), {
            "type": "grammar", "level": "A1", "count": 5, "shuffle": "false",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], sorted(item["id"] for item in response.data))

    def test_instant_answer_check_returns_feedback_for_one_answer_only(self):
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        response = self.client.post(
            reverse("quiz_check_answer"),
            {"question_id": question.id, "answer": question.correct_option},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_correct"])
        self.assertEqual(response.data["correct_answer"], question.correct_option)
        self.assertNotIn("correct_option", response.data)

    def test_mixed_quiz_submission_accepts_questions_from_multiple_types_and_levels(self):
        vocabulary = Question.objects.filter(quiz_type="vocabulary", level="A1").first()
        grammar = Question.objects.filter(quiz_type="grammar", level="B1").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {
                "quiz_type": "mixed",
                "level": "all",
                "answers": {
                    str(vocabulary.id): vocabulary.correct_option,
                    str(grammar.id): grammar.correct_option,
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual({item["quiz_type"] for item in response.data["details"]}, {"vocabulary", "grammar"})
        self.assertEqual(QuizSession.objects.get(user=self.learner).quiz_type, "mixed")

    def test_new_cefr_levels_have_questions_for_each_skill(self):
        for quiz_type in ("vocabulary", "reading", "grammar"):
            for level in ("A2", "B2", "C2"):
                response = self.client.get(reverse("quiz_questions"), {
                    "type": quiz_type, "level": level, "count": 30,
                })
                self.assertEqual(response.status_code, 200, f"Missing {quiz_type} content at {level}")
                self.assertEqual(len(response.data), 8)
                self.assertTrue(all(item["level"] == level for item in response.data))

    def test_invalid_cefr_level_is_rejected(self):
        response = self.client.get(reverse("quiz_questions"), {"type": "grammar", "level": "D1"})
        self.assertEqual(response.status_code, 400)

    def test_questions_from_another_level_cannot_be_submitted(self):
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "grammar", "level": "C1", "answers": {str(question.id): question.correct_option}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(QuizSession.objects.count(), 0)

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
            {"quiz_type": "vocabulary", "level": question.level, "answers": {str(question.id): "A"}},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(QuizSession.objects.count(), 0)

    def test_question_id_with_leading_zero_does_not_raise_server_error(self):
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "grammar", "level": "A1", "answers": {f"0{question.id}": question.correct_option}},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], 1)

    def test_question_ids_with_duplicate_normalized_values_are_rejected(self):
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        response = self.client.post(
            reverse("quiz_submit"),
            {
                "quiz_type": "grammar",
                "level": "A1",
                "answers": {
                    str(question.id): question.correct_option,
                    f"0{question.id}": question.correct_option,
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("only once", response.data["answers"])
        self.assertEqual(QuizSession.objects.filter(user=self.learner).count(), 0)

    def test_nonpositive_question_ids_are_rejected(self):
        for question_id in ("0", "-1"):
            response = self.client.post(
                reverse("quiz_submit"),
                {"quiz_type": "grammar", "level": "A1", "answers": {question_id: "A"}},
                format="json",
            )
            self.assertEqual(response.status_code, 400, question_id)
            self.assertIn("answers", response.data)

    def test_submitting_more_than_thirty_answers_is_rejected(self):
        base_question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        questions = [base_question]
        for index in range(30):
            questions.append(Question.objects.create(
                quiz_type=base_question.quiz_type,
                question_text=f"Extra test question {index}",
                option_a=base_question.option_a,
                option_b=base_question.option_b,
                option_c=base_question.option_c,
                option_d=base_question.option_d,
                correct_option=base_question.correct_option,
                explanation=base_question.explanation,
                level=base_question.level,
            ))
        answers = {str(question.id): question.correct_option for question in questions}

        response = self.client.post(
            reverse("quiz_submit"),
            {"quiz_type": "grammar", "level": "A1", "answers": answers},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("no more than 30", response.data["answers"])
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


    def test_adaptive_progress_is_separate_for_grammar_and_vocabulary(self):
        grammar = Question.objects.filter(quiz_type="grammar", level="A1").first()
        vocab = Question.objects.filter(quiz_type="vocabulary", level="A1").first()
        for question in (grammar, vocab):
            response = self.client.post(
                reverse("quiz_check_answer"),
                {"question_id": question.id, "answer": question.correct_option, "adaptive": True},
                format="json",
            )
            self.assertEqual(response.status_code, 200)
            self.assertIn("adaptive_progress", response.data)
        from .models import AdaptiveQuizProgress
        self.assertEqual(AdaptiveQuizProgress.objects.get(user=self.learner, skill="grammar").total_attempts, 1)
        self.assertEqual(AdaptiveQuizProgress.objects.get(user=self.learner, skill="vocabulary").total_attempts, 1)

    def test_two_wrong_adaptive_answers_reduce_difficulty_and_focus_topic(self):
        from .models import AdaptiveQuizProgress
        question = Question.objects.filter(quiz_type="grammar", level="A1").first()
        wrong_answer = next(option for option in ("A", "B", "C", "D") if option != question.correct_option)
        for _ in range(2):
            response = self.client.post(
                reverse("quiz_check_answer"),
                {"question_id": question.id, "answer": wrong_answer, "adaptive": True},
                format="json",
            )
            self.assertEqual(response.status_code, 200)
        progress = AdaptiveQuizProgress.objects.get(user=self.learner, skill="grammar")
        self.assertEqual(progress.current_difficulty, "easy")
        self.assertEqual(progress.focus_topic, question.topic)
        self.assertEqual(progress.topic_mistakes[question.topic], 2)

    def test_three_correct_adaptive_answers_increase_difficulty(self):
        from .models import AdaptiveQuizProgress
        question = Question.objects.filter(quiz_type="vocabulary", level="A1").first()
        for _ in range(3):
            response = self.client.post(
                reverse("quiz_check_answer"),
                {"question_id": question.id, "answer": question.correct_option, "adaptive": True},
                format="json",
            )
            self.assertEqual(response.status_code, 200)
        progress = AdaptiveQuizProgress.objects.get(user=self.learner, skill="vocabulary")
        self.assertEqual(progress.current_difficulty, "hard")
        self.assertEqual(progress.correct_streak, 0)

    def test_adaptive_next_question_returns_one_question_and_private_progress(self):
        response = self.client.get(reverse("adaptive_quiz_next"), {"skill": "grammar", "level": "A1"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("question", response.data)
        self.assertEqual(response.data["question"]["quiz_type"], "grammar")
        self.assertNotIn("correct_option", response.data["question"])
        self.assertEqual(response.data["progress"]["current_difficulty"], "medium")
        self.client.force_authenticate(user=self.other)
        other_progress = self.client.get(reverse("adaptive_quiz_progress"))
        self.assertEqual(other_progress.data, [])

    def test_adaptive_next_question_rejects_mixed_skill(self):
        response = self.client.get(reverse("adaptive_quiz_next"), {"skill": "mixed"})
        self.assertEqual(response.status_code, 400)


    def test_question_difficulty_is_varied_within_each_cefr_skill_group(self):
        for skill in ("vocabulary", "reading", "grammar"):
            for level in ("A1", "A2", "B1", "B2", "C1", "C2"):
                difficulties = set(
                    Question.objects.filter(quiz_type=skill, level=level).values_list("difficulty", flat=True)
                )
                self.assertGreaterEqual(
                    len(difficulties), 2,
                    f"Adaptive difficulty should vary within {skill}/{level}",
                )

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APIClient

from .models import WritingSubmission
from rag.services import CorrectionUnavailable


User = get_user_model()


class LegacyWritingServiceTests(TestCase):
    @patch("writing.services.correct_writing", return_value={
        "corrected_text": "I went home.",
        "feedback": "Use past tense.",
        "score": 90,
        "grammar_reference": "Past simple",
    })
    def test_legacy_service_returns_real_provider_result(self, _correct):
        from writing.services import analyze_text_with_llm

        result = analyze_text_with_llm("I go home yesterday.")

        self.assertEqual(result[0]["correction"], "I went home.")
        self.assertEqual(result[0]["reason"], "Use past tense.")
        self.assertEqual(result[0]["score"], 90)
        _correct.assert_called_once_with("I go home yesterday.")

    @patch("writing.services.correct_writing", side_effect=RuntimeError("provider unavailable"))
    def test_legacy_service_does_not_fabricate_feedback_when_provider_fails(self, _correct):
        from writing.services import analyze_text_with_llm

        with self.assertRaisesMessage(RuntimeError, "provider unavailable"):
            analyze_text_with_llm("I go home yesterday.")



class WritingWorkspaceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="learner", password="Strong-test-pass-123")
        self.other_user = User.objects.create_user(username="another", password="Strong-test-pass-123")
        self.workspace_url = reverse("writing_submit")

    def test_workspace_requires_login(self):
        response = self.client.get(self.workspace_url)
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_authenticated_user_can_open_workspace(self):
        self.client.force_login(self.user)
        response = self.client.get(self.workspace_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Make space for better English.")
        self.assertContains(response, "When GROQ_API_KEY is configured")

    def test_submission_is_saved_to_current_user_and_redirects(self):
        self.client.force_login(self.user)
        response = self.client.post(self.workspace_url, {"original_text": "I enjoy learning English."})
        self.assertRedirects(response, self.workspace_url)
        submission = WritingSubmission.objects.get()
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.original_text, "I enjoy learning English.")
        self.assertIsNone(submission.score)
        self.assertEqual(submission.corrected_text, "")
        self.assertContains(self.client.get(self.workspace_url), "I enjoy learning English.")

    @patch("writing.views.correct_writing", return_value={
        "corrected_text": "I went to school yesterday.",
        "feedback": "Use past simple for a completed past action.",
        "score": 92,
        "grammar_reference": "Past simple rule",
    })
    @override_settings(GROQ_API_KEY="test-key")
    def test_submission_saves_real_correction_feedback_and_score(self, _correct):
        self.client.force_login(self.user)
        response = self.client.post(
            self.workspace_url,
            {"original_text": "I go to school yesterday."},
        )
        self.assertRedirects(response, self.workspace_url)
        submission = WritingSubmission.objects.get()
        self.assertEqual(submission.corrected_text, "I went to school yesterday.")
        self.assertEqual(submission.feedback, "Use past simple for a completed past action.")
        self.assertEqual(submission.score, 92)

    def test_blank_submission_is_not_saved(self):
        self.client.force_login(self.user)
        response = self.client.post(self.workspace_url, {"original_text": "   "})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WritingSubmission.objects.count(), 0)
        self.assertContains(response, "Please enter a piece of writing")

    def test_overlong_submission_is_not_saved(self):
        self.client.force_login(self.user)
        response = self.client.post(self.workspace_url, {"original_text": "a" * 5001})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WritingSubmission.objects.count(), 0)
        self.assertContains(response, "5,000 characters or fewer")

    @patch("writing.views._consume_html_correction_quota", return_value=False)
    def test_web_form_enforces_daily_writing_limit(self, _quota):
        self.client.force_login(self.user)
        response = self.client.post(self.workspace_url, {"original_text": "I am practicing English."})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(WritingSubmission.objects.count(), 0)
        self.assertContains(response, "Daily writing limit reached")

    def test_user_only_sees_own_submissions(self):
        WritingSubmission.objects.create(user=self.user, original_text="My private writing")
        WritingSubmission.objects.create(user=self.other_user, original_text="Someone else's private writing")
        self.client.force_login(self.user)
        response = self.client.get(self.workspace_url)
        self.assertContains(response, "My private writing")
        self.assertNotContains(response, "Someone else's private writing")


class WritingAPIPermissionsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="api-learner", password="Strong-test-pass-123")
        self.other_user = User.objects.create_user(username="api-other", password="Strong-test-pass-123")
        self.client = APIClient()
        self.url = reverse("api_writings")

    def test_api_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_get_returns_only_authenticated_users_writings(self):
        own = WritingSubmission.objects.create(user=self.user, original_text="My entry")
        WritingSubmission.objects.create(user=self.other_user, original_text="Private entry")
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([entry["id"] for entry in response.data], [own.id])
        self.assertEqual(response.data[0]["original_text"], "My entry")

    def test_delete_removes_only_authenticated_users_writings(self):
        WritingSubmission.objects.create(user=self.user, original_text="My entry")
        other_entry = WritingSubmission.objects.create(user=self.other_user, original_text="Private entry")
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["deleted_count"], 1)
        self.assertFalse(WritingSubmission.objects.filter(user=self.user).exists())
        self.assertTrue(WritingSubmission.objects.filter(pk=other_entry.pk).exists())

    def test_post_assigns_owner_server_side_and_ignores_client_score(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {
                "original_text": "I am practicing.",
                "user": self.other_user.pk,
                "score": 100,
                "corrected_text": "forged correction",
                "feedback": "forged feedback",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        submission = WritingSubmission.objects.get()
        self.assertEqual(submission.user, self.user)
        self.assertIsNone(submission.score)
        self.assertEqual(submission.corrected_text, "")
        self.assertNotEqual(submission.feedback, "forged feedback")

    @patch("writing.views.correct_writing", return_value={
        "corrected_text": "She goes to school every day.",
        "feedback": "Use the third-person singular form 'goes'.",
        "score": 87,
        "mistakes": [{
            "original": "She go",
            "correction": "She goes",
            "explanation": "Use -s with he/she/it in the present simple.",
            "category": "grammar",
        }],
        "grammar_reference": "Subject-verb agreement",
    })
    @override_settings(GROQ_API_KEY="test-key")
    def test_api_returns_real_correction_feedback_and_score(self, _correct):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {"original_text": "She go to school every day."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["corrected_text"], "She goes to school every day.")
        self.assertEqual(response.data["feedback"], "Use the third-person singular form 'goes'.")
        self.assertEqual(response.data["score"], 87)
        self.assertEqual(response.data["mistakes"][0]["category"], "grammar")
        self.assertEqual(response.data["mistakes"][0]["original"], "She go")
        self.assertEqual(WritingSubmission.objects.get().mistakes[0]["correction"], "She goes")

    def test_api_rejects_blank_and_overlong_text(self):
        self.client.force_authenticate(user=self.user)
        blank = self.client.post(self.url, {"original_text": "  "}, format="json")
        long_text = self.client.post(self.url, {"original_text": "x" * 5001}, format="json")
        self.assertEqual(blank.status_code, 400)
        self.assertEqual(long_text.status_code, 400)
        self.assertEqual(WritingSubmission.objects.count(), 0)


    @override_settings(GROQ_API_KEY="your-groq-api-key")
    def test_api_reports_placeholder_groq_key_as_configuration_error(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {"original_text": "I am learning English."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["ai_status"], "unavailable")
        self.assertEqual(response.data["ai_error_code"], "missing_api_key")
        self.assertIsNone(response.data["score"])
        self.assertEqual(response.data["corrected_text"], "")

    @patch("writing.views.correct_writing", side_effect=CorrectionUnavailable("provider unavailable"))
    @override_settings(GROQ_API_KEY="configured-test-key")
    def test_api_reports_provider_failure_separately_from_missing_key(self, _correct):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.url,
            {"original_text": "I am learning English."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["ai_status"], "unavailable")
        self.assertEqual(response.data["ai_error_code"], "provider_error")
        self.assertIn("provider request failed", response.data["feedback"])

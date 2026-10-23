from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from .knowledge_base import retrieve_grammar_rule
from .services import CorrectionUnavailable, correct_writing
from .management.commands.diagnose_ai import classify_error


class GrammarRetrievalTests(SimpleTestCase):
    def test_retrieves_relevant_rule_from_local_documents(self):
        result = retrieve_grammar_rule("She go to work yesterday.")
        self.assertIn("Past simple", result)
        self.assertIn("finished", result)

    def test_unknown_input_does_not_invent_a_rule(self):
        result = retrieve_grammar_rule("qzxv blorpt nargle")
        self.assertIn("No matching grammar reference", result)


class CorrectWritingTests(SimpleTestCase):
    @patch("rag.services.retrieve_grammar_rule", return_value="Use past simple for completed past actions.")
    @patch("rag.services.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_returns_structured_feedback_and_clamps_score(self, groq_cls, _retrieve):
        message = MagicMock()
        message.content = '{"corrected_text":"I went home.","feedback":"Use past simple.","score":120}'
        groq_cls.return_value.chat.completions.create.return_value.choices = [
            MagicMock(message=message)
        ]
        result = correct_writing("I go home yesterday.")
        self.assertEqual(result["corrected_text"], "I went home.")
        self.assertEqual(result["score"], 100)
        self.assertIn("past simple", result["grammar_reference"])
        request = groq_cls.return_value.chat.completions.create.call_args.kwargs
        self.assertIn("Use past simple for completed past actions.", request["messages"][1]["content"])
        self.assertEqual(request["model"], "test-model")

    @patch("rag.services.retrieve_grammar_rule", return_value="Past simple rule")
    @patch("rag.services.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_rejects_fractional_score(self, groq_cls, _retrieve):
        message = MagicMock()
        message.content = '{"corrected_text":"I went home.","feedback":"Use past simple.","score":91.5}'
        groq_cls.return_value.chat.completions.create.return_value.choices = [
            MagicMock(message=message)
        ]
        with self.assertRaises(CorrectionUnavailable):
            correct_writing("I go home yesterday.")

    @override_settings(GROQ_API_KEY="")
    def test_requires_api_key(self):
        with self.assertRaises(CorrectionUnavailable):
            correct_writing("I go to school.")

    @patch("rag.services.retrieve_grammar_rule", side_effect=OSError("knowledge file unavailable"))
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_retrieval_failure_is_reported_as_unavailable(self, _retrieve):
        with self.assertRaises(CorrectionUnavailable):
            correct_writing("I went home yesterday.")

    @patch("rag.services.retrieve_grammar_rule", return_value="Past simple rule")
    @patch("rag.services.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_provider_errors_are_reported_as_unavailable(self, groq_cls, _retrieve):
        groq_cls.side_effect = RuntimeError("provider unavailable")
        with self.assertRaises(CorrectionUnavailable):
            correct_writing("I went home yesterday.")


class ProviderDiagnosticTests(SimpleTestCase):
    def test_classifies_permission_denied_without_exposing_exception_message(self):
        exc = RuntimeError("sensitive response content")
        exc.status_code = 403
        diagnosis = classify_error(exc)
        self.assertIn("HTTP 403", diagnosis)
        self.assertNotIn("sensitive response content", diagnosis)

    def test_classifies_rate_limit(self):
        exc = RuntimeError("rate limit")
        exc.status_code = 429
        self.assertIn("HTTP 429", classify_error(exc))

    def test_classifies_timeout_by_exception_type(self):
        class ProviderTimeout(Exception):
            pass

        self.assertIn("timed out", classify_error(ProviderTimeout()))

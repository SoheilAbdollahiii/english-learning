import json
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from .knowledge_base import retrieve_grammar_rule
from .services import CorrectionUnavailable, correct_writing


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

    @patch("rag.services.retrieve_grammar_rule", return_value="Subject-verb agreement rule")
    @patch("rag.services.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_returns_sanitized_structured_mistakes(self, groq_cls, _retrieve):
        message = MagicMock()
        message.content = json.dumps({
            "corrected_text": "She goes to school.",
            "feedback": "Use the third-person singular form.",
            "score": 88,
            "mistakes": [
                {
                    "original": "She go",
                    "correction": "She goes",
                    "explanation": "Use -s with he/she/it in the present simple.",
                    "category": "grammar",
                },
                {
                    "original": "",
                    "correction": "x",
                    "explanation": "Invalid item should be ignored.",
                    "category": "grammar",
                },
                {
                    "original": "school",
                    "correction": "school",
                    "explanation": "Unsupported category falls back safely.",
                    "category": "made_up",
                },
            ],
        })
        groq_cls.return_value.chat.completions.create.return_value.choices = [MagicMock(message=message)]

        result = correct_writing("She go to school.")

        self.assertEqual(len(result["mistakes"]), 2)
        self.assertEqual(result["mistakes"][0]["original"], "She go")
        self.assertEqual(result["mistakes"][0]["category"], "grammar")
        self.assertEqual(result["mistakes"][1]["category"], "other")

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
        with self.assertLogs("rag.services", level="ERROR") as logs:
            with self.assertRaises(CorrectionUnavailable):
                correct_writing("I went home yesterday.")
        self.assertIn("Groq writing correction failed (model=test-model)", logs.output[0])

    @patch("rag.services.retrieve_grammar_rule", return_value="Past simple rule")
    @patch("rag.services.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_classifies_invalid_api_key_response(self, groq_cls, _retrieve):
        error = RuntimeError("unauthorized")
        error.status_code = 401
        groq_cls.return_value.chat.completions.create.side_effect = error
        with self.assertRaises(CorrectionUnavailable) as raised:
            correct_writing("I go home yesterday.")
        self.assertEqual(raised.exception.code, "invalid_api_key")



class ConversationServiceTests(SimpleTestCase):
    def test_rejects_invalid_level_and_scenario(self):
        from .conversation import continue_conversation
        with self.assertRaises(ValueError):
            continue_conversation("C2", "daily", [{"role": "user", "content": "Hello"}])
        with self.assertRaises(ValueError):
            continue_conversation("B1", "unsupported", [{"role": "user", "content": "Hello"}])

    def test_rejects_empty_or_oversized_conversation(self):
        from .conversation import continue_conversation
        with self.assertRaises(ValueError):
            continue_conversation("A1", "daily", [])
        with self.assertRaises(ValueError):
            continue_conversation("A1", "daily", [{"role": "user", "content": "x" * 1201}])

    @patch("rag.conversation.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_returns_roleplay_reply_correction_and_useful_phrases(self, groq_cls):
        from .conversation import continue_conversation
        message = MagicMock()
        message.content = json.dumps({
            "reply": "Of course. Would you like a drink with that?",
            "corrected_text": "I would like a coffee, please.",
            "feedback": "Use 'would like' to make a polite request.",
            "useful_phrases": [{"phrase": "Would you like...?", "meaning": "آیا میل دارید؟"}],
        })
        groq_cls.return_value.chat.completions.create.return_value.choices = [MagicMock(message=message)]
        result = continue_conversation("A1", "restaurant", [{"role": "user", "content": "I want coffee."}])
        self.assertEqual(result["reply"], "Of course. Would you like a drink with that?")
        self.assertEqual(result["corrected_text"], "I would like a coffee, please.")
        self.assertEqual(result["useful_phrases"][0]["phrase"], "Would you like...?")
        request = groq_cls.return_value.chat.completions.create.call_args.kwargs
        self.assertIn("CEFR level is A1", request["messages"][0]["content"])
        self.assertEqual(request["model"], "test-model")

    @override_settings(GROQ_API_KEY="")
    def test_requires_configured_provider(self):
        from .conversation import ConversationUnavailable, continue_conversation
        with self.assertRaises(ConversationUnavailable):
            continue_conversation("B1", "daily", [{"role": "user", "content": "Hi there."}])

    @patch("rag.conversation.Groq")
    @override_settings(GROQ_API_KEY="test-key", GROQ_MODEL="test-model")
    def test_rejects_malformed_provider_response(self, groq_cls):
        from .conversation import ConversationUnavailable, continue_conversation
        message = MagicMock()
        message.content = '{"reply": ""}'
        groq_cls.return_value.chat.completions.create.return_value.choices = [MagicMock(message=message)]
        with self.assertRaises(ConversationUnavailable):
            continue_conversation("B1", "daily", [{"role": "user", "content": "Hi there."}])


from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase


class ConversationEndpointTests(APITestCase):
    def test_endpoint_requires_authentication(self):
        response = self.client.post(
            reverse("conversation_turn"),
            {"level": "A1", "scenario": "daily", "messages": [{"role": "user", "content": "Hello"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_endpoint_rejects_invalid_cefr_level(self):
        user = get_user_model().objects.create_user(username="conversation-learner", password="Strong-test-pass-123")
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse("conversation_turn"),
            {"level": "C2", "scenario": "daily", "messages": [{"role": "user", "content": "Hello"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)

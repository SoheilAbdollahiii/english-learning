"""Compatibility wrapper for the active Groq-backed writing correction service."""

from rag.services import correct_writing


def analyze_text_with_llm(text):
    """Return the legacy list-shaped response using real correction results.

    This wrapper deliberately does not manufacture example corrections when the
    provider is unavailable; the caller receives the service's exception instead.
    """
    result = correct_writing(text)
    return [
        {
            "error": text,
            "correction": result["corrected_text"],
            "reason": result["feedback"],
            "grammar_reference": result.get("grammar_reference", ""),
            "score": result["score"],
        }
    ]

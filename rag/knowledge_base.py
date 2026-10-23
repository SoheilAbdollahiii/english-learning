"""Small, offline document retriever for the English grammar knowledge base.

Documents are stored with the application, so retrieval does not depend on downloading
an embedding model at runtime. The selected document is passed to the LLM as RAG context.
"""
import re
from pathlib import Path

from django.conf import settings

KNOWLEDGE_FILE = Path(settings.BASE_DIR) / "rag" / "knowledge" / "grammar_rules.md"
_TOKEN_RE = re.compile(r"[a-z]+")
_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by",
    "can", "did", "do", "does", "for", "from", "had", "has", "have", "he",
    "her", "here", "him", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "me", "my", "of", "on", "or", "our", "she", "so", "that", "the",
    "their", "them", "there", "they", "this", "to", "us", "was", "we", "were",
    "what", "when", "where", "which", "who", "will", "with", "you", "your",
}


def _tokens(text):
    return {
        token for token in _TOKEN_RE.findall(text.lower())
        if len(token) > 1 and token not in _STOP_WORDS
    }


def _load_documents():
    if not KNOWLEDGE_FILE.exists():
        return []
    raw = KNOWLEDGE_FILE.read_text(encoding="utf-8")
    sections = re.split(r"(?m)^##\s+", raw)
    documents = []
    for section in sections:
        section = section.strip()
        if not section or section.startswith("# "):
            continue
        heading, _, body = section.partition("\n")
        body = body.strip()
        if heading and body:
            documents.append({"title": heading.strip(), "content": body})
    return documents


def retrieve_grammar_rule(error_text: str) -> str:
    """Return the most relevant rule from local documents, or an explicit no-match."""
    query_tokens = _tokens(error_text)
    documents = _load_documents()
    if not query_tokens or not documents:
        return "No matching grammar reference was found in the local knowledge base."

    ranked = []
    for document in documents:
        doc_tokens = _tokens(document["title"] + " " + document["content"])
        overlap = query_tokens & doc_tokens
        if overlap:
            # Normalize overlap so long documents do not win solely by length.
            score = len(overlap) / (len(query_tokens) * len(doc_tokens)) ** 0.5
            ranked.append((score, document))
    if not ranked:
        return "No matching grammar reference was found in the local knowledge base."

    ranked.sort(key=lambda item: item[0], reverse=True)
    best_score, best = ranked[0]
    if best_score < 0.08:
        return "No matching grammar reference was found in the local knowledge base."
    return f"{best['title']}\n{best['content']}"

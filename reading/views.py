from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Article, ArticleProgress


@api_view(["GET"])
def get_articles(request):
    articles = Article.objects.all().order_by("-id")
    level = request.query_params.get("level")
    query = request.query_params.get("q", "").strip()
    if level in {"A1", "B1", "C1"}:
        articles = articles.filter(level=level)
    if query:
        from django.db.models import Q
        articles = articles.filter(Q(title__icontains=query) | Q(content__icontains=query))
    return Response([
        {"id": article.id, "title": article.title, "content": article.content, "level": article.level}
        for article in articles
    ])


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def article_progress(request):
    if request.method == "GET":
        rows = ArticleProgress.objects.filter(user=request.user).select_related("article")
        return Response([
            {"article_id": row.article_id, "completed": row.completed, "updated_at": row.updated_at}
            for row in rows
        ])

    article_id = request.data.get("article_id")
    if isinstance(article_id, bool) or not str(article_id).strip().isdigit():
        return Response({"article_id": "Enter a valid article ID."}, status=status.HTTP_400_BAD_REQUEST)
    article_id = int(article_id)
    if article_id < 1:
        return Response({"article_id": "Enter a valid article ID."}, status=status.HTTP_400_BAD_REQUEST)

    completed = request.data.get("completed", True)
    if not isinstance(completed, bool):
        return Response({"completed": "Expected true or false."}, status=status.HTTP_400_BAD_REQUEST)
    article = get_object_or_404(Article, id=article_id)
    progress, _ = ArticleProgress.objects.update_or_create(
        user=request.user,
        article=article,
        defaults={"completed": completed},
    )
    return Response(
        {"article_id": progress.article_id, "completed": progress.completed, "updated_at": progress.updated_at},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def get_interactive_stories(request):
    """Return curated branching stories without leaking comprehension answer keys."""
    from .stories import public_stories

    return Response(public_stories())


@api_view(["POST"])
def check_interactive_story_answer(request):
    """Check a learner's answer without sending answer keys to the browser."""
    from .stories import STORIES, check_story_answer

    story_id = request.data.get("story_id")
    node_id = request.data.get("node_id")
    option_index = request.data.get("option_index")
    if not isinstance(story_id, str) or not isinstance(node_id, str):
        return Response({"detail": "A valid story_id and node_id are required."}, status=status.HTTP_400_BAD_REQUEST)
    if isinstance(option_index, bool) or not isinstance(option_index, int):
        return Response({"detail": "option_index must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
    if not any(story["id"] == story_id for story in STORIES):
        return Response({"detail": "Story not found."}, status=status.HTTP_404_NOT_FOUND)
    result = check_story_answer(story_id, node_id, option_index)
    if result is None:
        return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
    if not result["valid"]:
        return Response({"detail": result["explanation"]}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"correct": result["correct"], "explanation": result["explanation"]})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def lookup_reading_text(request):
    """Look up a word or phrase in context and translate its containing sentence."""
    from .lexicon import lookup_reading_text as build_lookup

    term = request.data.get("term")
    sentence = request.data.get("sentence")
    if not isinstance(term, str) or not isinstance(sentence, str):
        return Response({"detail": "Both term and sentence must be text."}, status=status.HTTP_400_BAD_REQUEST)
    term = " ".join(term.split()).strip()
    sentence = " ".join(sentence.split()).strip()
    if len(term) > 100 or not sentence or len(sentence) > 400:
        return Response(
            {"detail": "Term must be at most 100 characters and sentence must be 1–400 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if (term and not any(character.isalpha() for character in term)) or not any(character.isalpha() for character in sentence):
        return Response({"detail": "Choose English text to look up."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(build_lookup(term, sentence))

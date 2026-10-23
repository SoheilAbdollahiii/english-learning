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

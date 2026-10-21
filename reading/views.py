from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer

@api_view(['GET'])
def get_articles(request):
    # مرتب‌سازی بر اساس شناسه (id) از جدیدترین به قدیمی‌ترین
    articles = Article.objects.all().order_by('-id')
    serializer = ArticleSerializer(articles, many=True)
    return Response(serializer.data)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Word
from .serializers import WordSerializer

@api_view(['GET'])
def get_words(request):
    # دریافت تمام لغات از دیتابیس و تبدیل آن‌ها به JSON
    words = Word.objects.all()
    serializer = WordSerializer(words, many=True)
    return Response(serializer.data)
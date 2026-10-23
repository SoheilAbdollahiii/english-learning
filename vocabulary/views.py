from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Word
from .serializers import WordSerializer
@api_view(['GET'])
def get_words(request):
    # دریافت تمام لغات از دیتابیس و تبدیل آن‌ها به JSON
    words = Word.objects.all()
    serializer = WordSerializer(words, many=True)
    return Response(serializer.data)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated]) # فقط کاربران لاگین شده
def manage_words(request):
    if request.method == 'GET':
        words = Word.objects.all().order_by('-id')
        serializer = WordSerializer(words, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # دریافت لغت جدید از سمت فرانت‌اند و ذخیره آن
        serializer = WordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
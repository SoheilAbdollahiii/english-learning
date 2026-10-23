from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Word
from .serializers import WordSerializer


@api_view(["GET"])
def get_words(request):
    """Public read-only access to curated vocabulary."""
    words = Word.objects.all().order_by("level", "english_word")
    serializer = WordSerializer(words, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_words(request):
    if request.method == "GET":
        words = Word.objects.all().order_by("level", "english_word")
        serializer = WordSerializer(words, many=True)
        return Response(serializer.data)

    # Vocabulary is shared curated content, not a personal user resource.
    # Only staff may create entries so ordinary accounts cannot alter the
    # shared learning material for every other learner.
    if not request.user.is_staff:
        return Response(
            {"detail": "Only staff users can add shared vocabulary entries."},
            status=403,
        )

    serializer = WordSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

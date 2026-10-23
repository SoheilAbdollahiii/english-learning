from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import UserWord, Word
from .serializers import UserWordSerializer, WordSerializer


@api_view(["GET"])
def get_words(request):
    """Public read-only access to curated vocabulary."""
    words = Word.objects.all().order_by("level", "english_word")
    return Response(WordSerializer(words, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_words(request):
    if request.method == "GET":
        words = Word.objects.all().order_by("level", "english_word")
        return Response(WordSerializer(words, many=True).data)

    if not request.user.is_staff:
        return Response(
            {"detail": "Only staff users can add shared vocabulary entries."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = WordSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_words(request):
    if request.method == "GET":
        words = UserWord.objects.filter(user=request.user)
        return Response(UserWordSerializer(words, many=True).data)

    serializer = UserWordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    word_text = serializer.validated_data["english_word"]
    saved = UserWord.objects.filter(user=request.user, english_word__iexact=word_text).first()
    if saved:
        return Response(UserWordSerializer(saved).data, status=status.HTTP_200_OK)
    saved = serializer.save(user=request.user)
    return Response(UserWordSerializer(saved).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def my_word_detail(request, word_id):
    try:
        word = UserWord.objects.get(id=word_id, user=request.user)
    except UserWord.DoesNotExist:
        return Response({"detail": "Saved word not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        word.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if "proficiency" in request.data:
        try:
            proficiency = int(request.data["proficiency"])
        except (TypeError, ValueError):
            return Response({"proficiency": "Enter an integer from 0 to 100."}, status=status.HTTP_400_BAD_REQUEST)
        if not 0 <= proficiency <= 100:
            return Response({"proficiency": "Enter a value from 0 to 100."}, status=status.HTTP_400_BAD_REQUEST)
        word.proficiency = proficiency
    if "translation" in request.data:
        word.translation = str(request.data["translation"]).strip()[:100]
    if "level" in request.data:
        level = request.data["level"]
        if level not in dict(UserWord.LEVEL_CHOICES):
            return Response({"level": "Choose A1, B1, or C1."}, status=status.HTTP_400_BAD_REQUEST)
        word.level = level
    word.save()
    return Response(UserWordSerializer(word).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def practice_word(request, word_id):
    try:
        word = UserWord.objects.get(id=word_id, user=request.user)
    except UserWord.DoesNotExist:
        return Response({"detail": "Saved word not found."}, status=status.HTTP_404_NOT_FOUND)
    _record_review(word, True)
    return Response(UserWordSerializer(word).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def review_queue(request):
    """Return up to 20 of the current learner's vocabulary items due for review."""
    due_words = UserWord.objects.filter(
        user=request.user,
        next_review_at__lte=timezone.now(),
    ).order_by("next_review_at", "english_word")[:20]
    return Response(UserWordSerializer(due_words, many=True).data)


def _record_review(word, remembered):
    now = timezone.now()
    word.last_reviewed_at = now
    word.review_count += 1

    if remembered:
        word.correct_count += 1
        interval = word.review_interval_days
        if interval < 1:
            interval = 1
        elif interval < 3:
            interval = 3
        elif interval < 7:
            interval = 7
        else:
            interval = min(interval * 2, 60)
        word.review_interval_days = interval
        word.next_review_at = now + timedelta(days=interval)
        word.proficiency = min(100, word.proficiency + 10)
    else:
        word.incorrect_count += 1
        word.review_interval_days = 0
        word.next_review_at = now + timedelta(minutes=10)
        word.proficiency = max(0, word.proficiency - 5)

    word.save(update_fields=[
        "last_reviewed_at", "review_interval_days", "review_count", "correct_count",
        "incorrect_count", "next_review_at", "proficiency", "updated_at",
    ])
    return word


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def review_word(request, word_id):
    """Record recall quality and schedule the next spaced review."""
    try:
        word = UserWord.objects.get(id=word_id, user=request.user)
    except UserWord.DoesNotExist:
        return Response({"detail": "Saved word not found."}, status=status.HTTP_404_NOT_FOUND)

    remembered = request.data.get("remembered")
    if not isinstance(remembered, bool):
        return Response(
            {"remembered": "Expected true or false."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _record_review(word, remembered)
    return Response(UserWordSerializer(word).data)

import random
from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Question, QuizSession
from .serializers import QuestionSerializer


QUIZ_TYPES = {"vocabulary", "reading", "grammar"}
QUIZ_LEVELS = {"A1", "B1", "C1"}
QUIZ_LEVEL_FILTERS = QUIZ_LEVELS | {"all"}
MAX_QUIZ_QUESTIONS = 30


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_quiz_questions(request):
    quiz_type = request.query_params.get("type", "vocabulary").strip().lower()
    if quiz_type not in QUIZ_TYPES:
        return Response({"detail": "Choose vocabulary, reading, or grammar."}, status=status.HTTP_400_BAD_REQUEST)

    level = request.query_params.get("level", "B1").strip().upper()
    if level not in QUIZ_LEVEL_FILTERS:
        return Response({"detail": "Choose level A1, B1, C1, or all."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        count = int(request.query_params.get("count", 5))
    except (TypeError, ValueError):
        return Response({"detail": "Question count must be an integer between 1 and 30."}, status=status.HTTP_400_BAD_REQUEST)
    if not 1 <= count <= MAX_QUIZ_QUESTIONS:
        return Response({"detail": "Question count must be between 1 and 30."}, status=status.HTTP_400_BAD_REQUEST)

    question_query = Question.objects.filter(quiz_type=quiz_type)
    if level != "all":
        question_query = question_query.filter(level=level)
    questions = list(question_query.order_by("id"))
    if not questions:
        return Response(
            {"detail": f"No questions are available for {quiz_type} at level {level} yet."},
            status=status.HTTP_404_NOT_FOUND,
        )

    selected = random.sample(questions, min(len(questions), count))
    return Response(QuestionSerializer(selected, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_quiz(request):
    quiz_type = str(request.data.get("quiz_type", "vocabulary")).strip().lower()
    answers = request.data.get("answers", {})
    level = str(request.data.get("level", "B1")).strip().upper()
    if quiz_type not in QUIZ_TYPES:
        return Response({"detail": "Choose vocabulary, reading, or grammar."}, status=status.HTTP_400_BAD_REQUEST)
    if level not in QUIZ_LEVELS:
        return Response({"detail": "Choose level A1, B1, or C1."}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(answers, dict) or not answers:
        return Response({"answers": "Submit at least one answer."}, status=status.HTTP_400_BAD_REQUEST)
    if len(answers) > MAX_QUIZ_QUESTIONS:
        return Response({"answers": "Submit no more than 30 answers per quiz."}, status=status.HTTP_400_BAD_REQUEST)

    normalized_answers = {}
    for raw_question_id, answer in answers.items():
        try:
            question_id = int(raw_question_id)
        except (TypeError, ValueError):
            return Response({"answers": "Question IDs must be integers."}, status=status.HTTP_400_BAD_REQUEST)
        if question_id < 1:
            return Response({"answers": "Question IDs must be positive integers."}, status=status.HTTP_400_BAD_REQUEST)
        if question_id in normalized_answers:
            return Response({"answers": "Submit each question only once."}, status=status.HTTP_400_BAD_REQUEST)
        normalized_answers[question_id] = answer

    question_ids = list(normalized_answers)
    question_query = Question.objects.filter(id__in=question_ids, quiz_type=quiz_type)
    if level != "all":
        question_query = question_query.filter(level=level)
    questions = {question.id: question for question in question_query}
    if len(questions) != len(question_ids):
        return Response(
            {"answers": "All submitted questions must belong to the selected quiz type and level."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    score = 0
    details = []
    for question_id in question_ids:
        question = questions.get(question_id)
        if question is None:
            continue
        user_answer = str(normalized_answers[question_id]).upper()
        if user_answer not in {"A", "B", "C", "D"}:
            return Response({"answers": "Answers must be A, B, C, or D."}, status=status.HTTP_400_BAD_REQUEST)
        is_correct = question.correct_option.upper() == user_answer
        score += int(is_correct)
        details.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "user_answer": user_answer,
            "correct_answer": question.correct_option.upper(),
            "is_correct": is_correct,
            "explanation": question.explanation or "No explanation provided for this question.",
        })

    total = len(details)
    if total == 0:
        return Response({"answers": "No valid answers were submitted."}, status=status.HTTP_400_BAD_REQUEST)

    QuizSession.objects.create(
        user=request.user,
        quiz_type=quiz_type,
        level=level,
        score=score,
        total_questions=total,
    )
    return Response({
        "quiz_type": quiz_type,
        "level": level,
        "score": score,
        "total": total,
        "percentage": round((score / total) * 100),
        "details": details,
        "message": "Quiz submitted successfully!",
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_history(request):
    sessions = QuizSession.objects.filter(user=request.user).order_by("-created_at")[:20]
    return Response([
        {
            "id": session.id,
            "quiz_type": session.quiz_type,
            "level": session.level,
            "score": session.score,
            "total_questions": session.total_questions,
            "percentage": round((session.score / session.total_questions) * 100) if session.total_questions else 0,
            "created_at": session.created_at,
        }
        for session in sessions
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_stats(request):
    """Return accurate per-user quiz streak and daily activity for the dashboard."""
    today = timezone.localdate()
    active_dates = set(
        QuizSession.objects.filter(user=request.user).dates("created_at", "day", order="DESC")
    )
    cursor = today if today in active_dates else today - timedelta(days=1)
    current_streak = 0
    while cursor in active_dates:
        current_streak += 1
        cursor -= timedelta(days=1)

    first_day = today - timedelta(days=6)
    counts = { (first_day + timedelta(days=offset)).isoformat(): 0 for offset in range(7) }
    recent_sessions = QuizSession.objects.filter(
        user=request.user,
        created_at__date__gte=first_day,
        created_at__date__lte=today,
    ).values_list("created_at", flat=True)
    for created_at in recent_sessions:
        day_key = timezone.localdate(created_at).isoformat()
        if day_key in counts:
            counts[day_key] += 1

    return Response({
        "current_streak": current_streak,
        "quiz_sessions_total": QuizSession.objects.filter(user=request.user).count(),
        "daily_activity": [
            {"date": day, "count": count} for day, count in counts.items()
        ],
    })

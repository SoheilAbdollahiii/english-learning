import random
from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AdaptiveQuizProgress, Question, QuizSession
from .serializers import QuestionSerializer


QUIZ_TYPES = {"vocabulary", "reading", "grammar"}
QUIZ_TYPE_FILTERS = QUIZ_TYPES | {"mixed"}
QUIZ_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
QUIZ_LEVEL_FILTERS = QUIZ_LEVELS | {"all"}
QUIZ_DIFFICULTIES = {"easy", "medium", "hard"}
QUIZ_DIFFICULTY_FILTERS = QUIZ_DIFFICULTIES | {"all"}
MAX_QUIZ_QUESTIONS = 30


def normalize_level(value):
    level = str(value or "B1").strip()
    return "all" if level.lower() == "all" else level.upper()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_quiz_questions(request):
    quiz_type = request.query_params.get("type", "vocabulary").strip().lower()
    if quiz_type not in QUIZ_TYPE_FILTERS:
        return Response({"detail": "Choose vocabulary, reading, grammar, or mixed."}, status=status.HTTP_400_BAD_REQUEST)

    level = normalize_level(request.query_params.get("level", "B1"))
    if level not in QUIZ_LEVEL_FILTERS:
        return Response({"detail": "Choose level A1, A2, B1, B2, C1, C2, or all."}, status=status.HTTP_400_BAD_REQUEST)

    difficulty = request.query_params.get("difficulty", "all").strip().lower()
    if difficulty not in QUIZ_DIFFICULTY_FILTERS:
        return Response({"detail": "Choose difficulty easy, medium, hard, or all."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        count = int(request.query_params.get("count", 5))
    except (TypeError, ValueError):
        return Response({"detail": "Question count must be an integer between 1 and 30."}, status=status.HTTP_400_BAD_REQUEST)
    if not 1 <= count <= MAX_QUIZ_QUESTIONS:
        return Response({"detail": "Question count must be between 1 and 30."}, status=status.HTTP_400_BAD_REQUEST)

    question_query = Question.objects.all()
    if quiz_type != "mixed":
        question_query = question_query.filter(quiz_type=quiz_type)
    if level != "all":
        question_query = question_query.filter(level=level)
    if difficulty != "all":
        question_query = question_query.filter(difficulty=difficulty)
    questions = list(question_query.order_by("id"))
    if not questions:
        return Response(
            {"detail": f"No questions are available for type={quiz_type}, level={level}, difficulty={difficulty}."},
            status=status.HTTP_404_NOT_FOUND,
        )

    selected = random.sample(questions, min(len(questions), count))
    shuffle_questions = request.query_params.get("shuffle", "true").strip().lower() in {"1", "true", "yes", "on"}
    if shuffle_questions:
        random.shuffle(selected)
    else:
        selected.sort(key=lambda question: question.id)
    return Response(QuestionSerializer(selected, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def check_quiz_answer(request):
    raw_question_id = request.data.get("question_id")
    answer = str(request.data.get("answer", "")).strip().upper()
    try:
        question_id = int(raw_question_id)
    except (TypeError, ValueError):
        return Response({"detail": "A valid question_id is required."}, status=status.HTTP_400_BAD_REQUEST)
    if question_id < 1 or answer not in {"A", "B", "C", "D"}:
        return Response({"detail": "Provide a positive question ID and answer A, B, C, or D."}, status=status.HTTP_400_BAD_REQUEST)
    question = Question.objects.filter(id=question_id).first()
    if question is None:
        return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
    is_correct = question.correct_option.upper() == answer
    payload = {
        "question_id": question.id,
        "user_answer": answer,
        "correct_answer": question.correct_option.upper(),
        "is_correct": is_correct,
        "explanation": question.explanation or "No explanation provided for this question.",
    }

    if str(request.data.get("adaptive", "")).lower() in {"1", "true", "yes", "on"}:
        # Adaptive progress is independent for Grammar, Vocabulary, and Reading.
        progress, _ = AdaptiveQuizProgress.objects.get_or_create(
            user=request.user, skill=question.quiz_type
        )
        progress.total_attempts += 1
        if is_correct:
            progress.total_correct += 1
            progress.correct_streak += 1
            progress.wrong_streak = 0
            if progress.correct_streak >= 3:
                index = ADAPTIVE_DIFFICULTY_ORDER.index(progress.current_difficulty)
                progress.current_difficulty = ADAPTIVE_DIFFICULTY_ORDER[min(index + 1, 2)]
                progress.correct_streak = 0
            if progress.focus_topic == question.topic and progress.focus_topic:
                topic_mistakes = dict(progress.topic_mistakes)
                topic_mistakes[question.topic] = max(0, topic_mistakes.get(question.topic, 0) - 1)
                if topic_mistakes[question.topic] == 0:
                    progress.focus_topic = ""
                    topic_mistakes.pop(question.topic, None)
                progress.topic_mistakes = topic_mistakes
        else:
            progress.wrong_streak += 1
            progress.correct_streak = 0
            progress.focus_topic = question.topic or question.quiz_type
            topic_mistakes = dict(progress.topic_mistakes)
            topic_mistakes[progress.focus_topic] = topic_mistakes.get(progress.focus_topic, 0) + 1
            progress.topic_mistakes = topic_mistakes
            if progress.wrong_streak >= 2:
                index = ADAPTIVE_DIFFICULTY_ORDER.index(progress.current_difficulty)
                progress.current_difficulty = ADAPTIVE_DIFFICULTY_ORDER[max(index - 1, 0)]
                progress.wrong_streak = 0
        progress.save()
        payload["adaptive_progress"] = _adaptive_progress_payload(progress)
        payload["recommended_next_difficulty"] = (
            "easy" if progress.focus_topic and progress.topic_mistakes.get(progress.focus_topic, 0) > 0
            else progress.current_difficulty
        )
        payload["recommended_topic"] = progress.focus_topic or ""

    return Response(payload)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_quiz(request):
    quiz_type = str(request.data.get("quiz_type", "vocabulary")).strip().lower()
    answers = request.data.get("answers", {})
    level = normalize_level(request.data.get("level", "B1"))
    if quiz_type not in QUIZ_TYPE_FILTERS:
        return Response({"detail": "Choose vocabulary, reading, grammar, or mixed."}, status=status.HTTP_400_BAD_REQUEST)
    if level not in QUIZ_LEVEL_FILTERS:
        return Response({"detail": "Choose level A1, B1, C1, or all."}, status=status.HTTP_400_BAD_REQUEST)
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
    question_query = Question.objects.filter(id__in=question_ids)
    if quiz_type != "mixed":
        question_query = question_query.filter(quiz_type=quiz_type)
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
        question = questions[question_id]
        user_answer = str(normalized_answers[question_id]).upper()
        if user_answer not in {"A", "B", "C", "D"}:
            return Response({"answers": "Answers must be A, B, C, or D."}, status=status.HTTP_400_BAD_REQUEST)
        is_correct = question.correct_option.upper() == user_answer
        score += int(is_correct)
        details.append({
            "question_id": question.id,
            "quiz_type": question.quiz_type,
            "level": question.level,
            "difficulty": question.difficulty,
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


ADAPTIVE_DIFFICULTY_ORDER = ("easy", "medium", "hard")


def _adaptive_progress_payload(progress):
    return {
        "skill": progress.skill,
        "current_difficulty": progress.current_difficulty,
        "correct_streak": progress.correct_streak,
        "wrong_streak": progress.wrong_streak,
        "total_attempts": progress.total_attempts,
        "accuracy": progress.accuracy,
        "focus_topic": progress.focus_topic,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_adaptive_quiz_question(request):
    """Select one question using only this learner's progress for the chosen skill."""
    skill = request.query_params.get("skill", "vocabulary").strip().lower()
    if skill not in QUIZ_TYPES:
        return Response({"detail": "Adaptive skill must be vocabulary, reading, or grammar."}, status=status.HTTP_400_BAD_REQUEST)

    level = normalize_level(request.query_params.get("level", "B1"))
    if level not in QUIZ_LEVEL_FILTERS:
        return Response({"detail": "Choose level A1, A2, B1, B2, C1, C2, or all."}, status=status.HTTP_400_BAD_REQUEST)

    progress, _ = AdaptiveQuizProgress.objects.get_or_create(user=request.user, skill=skill)
    query = Question.objects.filter(quiz_type=skill)
    if level != "all":
        query = query.filter(level=level)

    focus_topic = progress.focus_topic
    needs_topic_practice = bool(focus_topic and progress.topic_mistakes.get(focus_topic, 0) > 0)
    preferred_difficulty = "easy" if needs_topic_practice else progress.current_difficulty
    candidate_query = query.filter(difficulty=preferred_difficulty)
    if needs_topic_practice:
        topic_query = candidate_query.filter(topic=focus_topic)
        if topic_query.exists():
            candidate_query = topic_query
        else:
            # Old/custom question banks may not have topic metadata yet. Keep practice
            # in the same skill and at an easier level rather than returning no question.
            candidate_query = query.filter(difficulty="easy")

    recent_ids = progress.recent_question_ids if isinstance(progress.recent_question_ids, list) else []
    fresh_query = candidate_query.exclude(id__in=recent_ids)
    if fresh_query.exists():
        candidate_query = fresh_query
    if not candidate_query.exists():
        # Small banks should still work after every question has been seen.
        candidate_query = query.filter(difficulty=preferred_difficulty)
        if needs_topic_practice:
            topic_query = candidate_query.filter(topic=focus_topic)
            if topic_query.exists():
                candidate_query = topic_query
    if not candidate_query.exists():
        available = list(query.values_list("difficulty", flat=True).distinct())
        if not available:
            return Response({"detail": f"No questions are available for {skill} at level {level}."}, status=status.HTTP_404_NOT_FOUND)
        preferred_index = ADAPTIVE_DIFFICULTY_ORDER.index(preferred_difficulty)
        chosen_difficulty = min(
            available,
            key=lambda value: abs(ADAPTIVE_DIFFICULTY_ORDER.index(value) - preferred_index)
            if value in ADAPTIVE_DIFFICULTY_ORDER else 99,
        )
        candidate_query = query.filter(difficulty=chosen_difficulty)

    question = random.choice(list(candidate_query))
    progress.recent_question_ids = (recent_ids + [question.id])[-20:]
    progress.save(update_fields=["recent_question_ids", "updated_at"])
    return Response({
        "question": QuestionSerializer(question).data,
        "progress": _adaptive_progress_payload(progress),
        "is_topic_practice": needs_topic_practice and question.topic == focus_topic,
        "requested_difficulty": preferred_difficulty,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def adaptive_quiz_progress(request):
    """Expose per-skill adaptive progress without leaking other learners' data."""
    progress = AdaptiveQuizProgress.objects.filter(user=request.user).order_by("skill")
    return Response([_adaptive_progress_payload(item) for item in progress])

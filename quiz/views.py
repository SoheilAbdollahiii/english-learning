import random
from datetime import timedelta

from django.db import IntegrityError, transaction

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AdaptiveQuizProgress, DailyChallengeAttempt, Question, QuizSession, UserGamification
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


TEACHING_EXAMPLES = {
    "conditionals": ("If it rains, we will stay home.", "اگر باران ببارد، در خانه می‌مانیم.", "Do not use 'will' in the if-clause for a real future condition."),
    "verb_tenses": ("She has lived here for three years.", "او سه سال است که اینجا زندگی می‌کند.", "Choose the tense from the time clue; 'since' gives a starting point and 'for' gives a duration."),
    "articles": ("I saw an elephant at the zoo.", "من در باغ‌وحش یک فیل دیدم.", "Use 'an' before a vowel sound, 'a' before a consonant sound, and 'the' for something specific."),
    "prepositions": ("The meeting starts at nine o’clock.", "جلسه ساعت نه شروع می‌شود.", "Time and place prepositions are not interchangeable; learn them with common phrases."),
    "modals": ("You should drink more water.", "بهتر است آب بیشتری بنوشی.", "A modal verb is followed by the base form: 'should go', not 'should to go'."),
    "passive_voice": ("The bridge was built in 1990.", "این پل در سال ۱۹۹۰ ساخته شد.", "Passive voice uses a form of 'be' plus the past participle."),
    "travel": ("I bought a ticket for the train.", "من برای قطار بلیت خریدم.", "Learn travel words in context and check which prepositions commonly follow them."),
    "work": ("Our meeting starts at ten.", "جلسهٔ ما ساعت ده شروع می‌شود.", "Work-related words often appear in fixed collocations; learn the whole phrase."),
    "education": ("The students are preparing for an exam.", "دانش‌آموزان برای یک امتحان آماده می‌شوند.", "Notice common word partnerships such as 'prepare for an exam'."),
    "food": ("We had a delicious meal together.", "ما با هم یک وعدهٔ غذایی خوشمزه خوردیم.", "Check whether a word names food, a meal, an ingredient, or an action."),
    "feelings": ("I felt nervous before the interview.", "قبل از مصاحبه احساس اضطراب داشتم.", "Feeling adjectives often describe a person’s state; check whether the word describes a feeling or its cause."),
    "nature": ("The forest is home to many animals.", "جنگل زیستگاه حیوانات زیادی است.", "Use context clues to distinguish related nature and environment words."),
    "main_idea": ("The passage mainly explains why exercise matters.", "این متن عمدتاً توضیح می‌دهد چرا ورزش اهمیت دارد.", "Do not choose an answer that mentions only one small detail when the question asks for the main idea."),
    "detail": ("According to the text, the library closes at six.", "طبق متن، کتابخانه ساعت شش تعطیل می‌شود.", "For detail questions, find evidence in the passage instead of relying on outside knowledge."),
    "inference": ("The streets are wet, so it probably rained.", "خیابان‌ها خیس‌اند، پس احتمالاً باران باریده است.", "An inference must be supported by clues in the text, not by an unsupported guess."),
    "vocabulary": ("I learned a new word and used it in a sentence.", "یک واژهٔ جدید یاد گرفتم و آن را در جمله‌ای به کار بردم.", "Do not choose a word only because it looks familiar; check the meaning in the sentence."),
    "reading": ("The writer gives two reasons to support the main point.", "نویسنده برای پشتیبانی از نکتهٔ اصلی دو دلیل می‌آورد.", "Base your answer on evidence from the passage."),
    "grammar": ("She has finished her homework.", "او تکالیفش را تمام کرده است.", "Match the verb form to the subject and the tense; for example, use 'has' with he, she, or it."),
}

def teaching_feedback(question):
    """Return consistent, actionable feedback for every answered question."""
    example, translation, common_mistake = TEACHING_EXAMPLES.get(
        question.topic or question.quiz_type,
        TEACHING_EXAMPLES.get(question.quiz_type, TEACHING_EXAMPLES["vocabulary"]),
    )
    correct_answer = (question.correct_option or "").upper()
    correct_text = getattr(question, f"option_{correct_answer.lower()}", "") if correct_answer in {"A", "B", "C", "D"} else ""
    return {
        "correct_answer": correct_answer,
        "correct_answer_text": correct_text,
        "explanation": question.explanation or (
            f"The correct choice is {correct_answer} ({correct_text}). "
            "Use the meaning and grammar of the full sentence to decide which option fits best."
        ),
        "example_sentence": question.example_sentence or example,
        "example_translation": question.example_translation or translation,
        "common_mistake": question.common_mistake or common_mistake,
    }


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
        "is_correct": is_correct,
        **teaching_feedback(question),
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
            **teaching_feedback(question),
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


DAILY_CHALLENGE_QUESTIONS = 10
DAILY_CHALLENGE_SECONDS = 5 * 60
XP_PER_CORRECT_ANSWER = 10
XP_FOR_COMPLETION = 25
XP_SPEED_BONUS = 10

BADGE_DEFINITIONS = {
    "first_challenge": {"name": "First Steps", "description": "Complete your first daily challenge."},
    "grammar_master": {"name": "Grammar Master", "description": "Answer 20 grammar questions correctly in daily challenges."},
    "vocabulary_explorer": {"name": "Vocabulary Explorer", "description": "Answer 20 vocabulary questions correctly in daily challenges."},
    "week_streak": {"name": "7-Day Streak", "description": "Complete daily challenges on seven consecutive days."},
}


def _gamification_payload(profile):
    return {
        "total_xp": profile.total_xp,
        "current_streak": profile.current_streak,
        "longest_streak": profile.longest_streak,
        "last_activity_date": profile.last_activity_date.isoformat() if profile.last_activity_date else None,
        "grammar_correct": profile.grammar_correct,
        "vocabulary_correct": profile.vocabulary_correct,
        "badges": [
            {"id": badge_id, **BADGE_DEFINITIONS[badge_id]}
            for badge_id in profile.badges if badge_id in BADGE_DEFINITIONS
        ],
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def daily_challenge(request):
    """Return the same ten-question mission for this user throughout the local day."""
    today = timezone.localdate()
    available = list(Question.objects.all().order_by("id"))
    if len(available) < DAILY_CHALLENGE_QUESTIONS:
        return Response(
            {"detail": "The question bank needs at least 10 questions before a daily challenge can be created."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    attempt = DailyChallengeAttempt.objects.filter(user=request.user, challenge_date=today).first()
    if attempt is None:
        selected = random.sample(available, DAILY_CHALLENGE_QUESTIONS)
        try:
            with transaction.atomic():
                attempt = DailyChallengeAttempt.objects.create(
                    user=request.user,
                    challenge_date=today,
                    question_ids=[question.id for question in selected],
                    total_questions=DAILY_CHALLENGE_QUESTIONS,
                )
        except IntegrityError:
            # A second tab may create today's challenge at the same time.
            attempt = DailyChallengeAttempt.objects.get(user=request.user, challenge_date=today)

    profile, _ = UserGamification.objects.get_or_create(user=request.user)
    payload = {
        "date": today.isoformat(),
        "question_count": attempt.total_questions,
        "duration_seconds": DAILY_CHALLENGE_SECONDS,
        "completed": attempt.is_completed,
        "correct_answers": attempt.correct_answers if attempt.is_completed else None,
        "xp_awarded": attempt.xp_awarded if attempt.is_completed else 0,
        "gamification": _gamification_payload(profile),
    }
    if not attempt.is_completed:
        questions_by_id = {
            question.id: question
            for question in Question.objects.filter(id__in=attempt.question_ids)
        }
        ordered_questions = [
            questions_by_id[question_id]
            for question_id in attempt.question_ids if question_id in questions_by_id
        ]
        if len(ordered_questions) != attempt.total_questions:
            selected = random.sample(available, DAILY_CHALLENGE_QUESTIONS)
            attempt.question_ids = [question.id for question in selected]
            attempt.save(update_fields=["question_ids"])
            ordered_questions = selected
        payload["questions"] = QuestionSerializer(ordered_questions, many=True).data
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gamification_status(request):
    profile, _ = UserGamification.objects.get_or_create(user=request.user)
    today = timezone.localdate()
    attempt = DailyChallengeAttempt.objects.filter(user=request.user, challenge_date=today).first()
    return Response({
        "gamification": _gamification_payload(profile),
        "daily_challenge": {
            "date": today.isoformat(),
            "completed": bool(attempt and attempt.is_completed),
            "question_count": DAILY_CHALLENGE_QUESTIONS,
            "duration_seconds": DAILY_CHALLENGE_SECONDS,
            "xp_awarded": attempt.xp_awarded if attempt and attempt.is_completed else 0,
        },
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_daily_challenge(request):
    """Score and reward today's challenge exactly once; XP is calculated server-side."""
    answers = request.data.get("answers")
    if not isinstance(answers, dict):
        return Response({"answers": "Submit an answers object."}, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.localdate()
    with transaction.atomic():
        attempt = DailyChallengeAttempt.objects.select_for_update().filter(
            user=request.user, challenge_date=today
        ).first()
        if attempt is None:
            return Response({"detail": "Start today's daily challenge first."}, status=status.HTTP_404_NOT_FOUND)
        if attempt.is_completed:
            profile, _ = UserGamification.objects.get_or_create(user=request.user)
            return Response({
                "detail": "Today's daily challenge has already been completed.",
                "already_completed": True,
                "correct_answers": attempt.correct_answers,
                "total": attempt.total_questions,
                "xp_awarded": attempt.xp_awarded,
                "gamification": _gamification_payload(profile),
            }, status=status.HTTP_200_OK)

        expected_ids = {str(question_id) for question_id in attempt.question_ids}
        normalized = {}
        for raw_id, raw_answer in answers.items():
            try:
                question_id = int(raw_id)
            except (TypeError, ValueError):
                return Response({"answers": "Question IDs must be integers."}, status=status.HTTP_400_BAD_REQUEST)
            answer = str(raw_answer).strip().upper()
            if str(question_id) not in expected_ids or answer not in {"A", "B", "C", "D"}:
                return Response({"answers": "Answers must use this challenge's question IDs and A, B, C, or D."}, status=status.HTTP_400_BAD_REQUEST)
            normalized[str(question_id)] = answer
        if set(normalized) != expected_ids:
            return Response({"answers": "Answer all 10 daily challenge questions before submitting."}, status=status.HTTP_400_BAD_REQUEST)

        question_map = {
            question.id: question
            for question in Question.objects.filter(id__in=attempt.question_ids)
        }
        if len(question_map) != attempt.total_questions:
            return Response({"detail": "Some challenge questions are no longer available. Please try again later."}, status=status.HTTP_409_CONFLICT)

        details = []
        correct = 0
        grammar_correct = 0
        vocabulary_correct = 0
        for question_id in attempt.question_ids:
            question = question_map[question_id]
            user_answer = normalized[str(question_id)]
            is_correct = user_answer == question.correct_option.upper()
            correct += int(is_correct)
            grammar_correct += int(is_correct and question.quiz_type == "grammar")
            vocabulary_correct += int(is_correct and question.quiz_type == "vocabulary")
            details.append({
                "question_id": question.id,
                "quiz_type": question.quiz_type,
                "question_text": question.question_text,
                "user_answer": user_answer,
                "is_correct": is_correct,
                **teaching_feedback(question),
            })

        profile, _ = UserGamification.objects.get_or_create(user=request.user)
        first_completion = not DailyChallengeAttempt.objects.filter(
            user=request.user, completed_at__isnull=False
        ).exists()
        now = timezone.now()
        elapsed_seconds = max(0, int((now - attempt.created_at).total_seconds()))
        xp_awarded = correct * XP_PER_CORRECT_ANSWER + XP_FOR_COMPLETION
        if elapsed_seconds <= DAILY_CHALLENGE_SECONDS:
            xp_awarded += XP_SPEED_BONUS

        if profile.last_activity_date != today:
            if profile.last_activity_date == today - timedelta(days=1):
                profile.current_streak += 1
            else:
                profile.current_streak = 1
            profile.last_activity_date = today
        profile.longest_streak = max(profile.longest_streak, profile.current_streak)
        profile.total_xp += xp_awarded
        profile.grammar_correct += grammar_correct
        profile.vocabulary_correct += vocabulary_correct
        badges = set(profile.badges if isinstance(profile.badges, list) else [])
        if first_completion:
            badges.add("first_challenge")
        if profile.grammar_correct >= 20:
            badges.add("grammar_master")
        if profile.vocabulary_correct >= 20:
            badges.add("vocabulary_explorer")
        if profile.current_streak >= 7:
            badges.add("week_streak")
        profile.badges = sorted(badges)
        profile.save()

        attempt.completed_at = now
        attempt.correct_answers = correct
        attempt.xp_awarded = xp_awarded
        attempt.save(update_fields=["completed_at", "correct_answers", "xp_awarded"])
        QuizSession.objects.create(
            user=request.user,
            quiz_type="mixed",
            level="all",
            score=correct,
            total_questions=attempt.total_questions,
        )

    return Response({
        "date": today.isoformat(),
        "correct_answers": correct,
        "total": attempt.total_questions,
        "percentage": round(correct * 100 / attempt.total_questions),
        "xp_awarded": xp_awarded,
        "speed_bonus_awarded": elapsed_seconds <= DAILY_CHALLENGE_SECONDS,
        "elapsed_seconds": elapsed_seconds,
        "details": details,
        "gamification": _gamification_payload(profile),
        "message": "Daily challenge completed!",
    }, status=status.HTTP_201_CREATED)

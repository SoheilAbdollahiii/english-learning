from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Question, QuizSession
from .serializers import QuestionSerializer, QuizSessionSerializer
import random

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_questions(request):
    quiz_type = request.GET.get('type', 'vocabulary')
    questions = list(Question.objects.filter(quiz_type=quiz_type))
    
    if not questions:
        sample = Question.objects.create(
            quiz_type=quiz_type,
            question_text="Choose the correct synonym for 'Happy':",
            option_a="Sad",
            option_b="Joyful",
            option_c="Angry",
            option_d="Tired",
            correct_option="B",
            explanation="'Joyful' means feeling, expressing, or causing great pleasure and happiness.",
            level="B1"
        )
        questions = [sample]

    selected = random.sample(questions, min(len(questions), 5))
    serializer = QuestionSerializer(selected, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request):
    data = request.data
    quiz_type = data.get('quiz_type', 'vocabulary')
    answers = data.get('answers', {}) # دیکشنری به شکل {question_id: 'A', ...}
    
    score = 0
    total = len(answers)
    detailed_results = []
    
    for q_id, user_ans in answers.items():
        try:
            q = Question.objects.get(id=q_id)
            is_correct = q.correct_option.upper() == user_ans.upper()
            if is_correct:
                score += 1
            
            detailed_results.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'user_answer': user_ans,
                'correct_answer': q.correct_option,
                'is_correct': is_correct,
                'explanation': q.explanation or 'No explanation provided for this question.'
            })
        except Question.DoesNotExist:
            continue

    session = QuizSession.objects.create(
        user=request.user,
        quiz_type=quiz_type,
        score=score,
        total_questions=total if total > 0 else 1
    )

    return Response({
        'score': score,
        'total': total,
        'percentage': int((score / total) * 100) if total > 0 else 0,
        'details': detailed_results,
        'message': 'Quiz submitted successfully!'
    }, status=201)
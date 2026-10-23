from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WritingSubmission
from .serializers import WritingSubmissionSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_writings(request):
    if request.method == 'GET':
        writings = WritingSubmission.objects.filter(user=request.user).order_by('-created_at')
        serializer = WritingSubmissionSerializer(writings, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = WritingSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            text = serializer.validated_data.get('original_text')
            
            # تحلیل هوش مصنوعی آزمایشی
            corrected = text.strip() + " (Checked & Optimized by AI)"
            feedback = "Great job! Vocabulary and sentence structure are generally good."
            score = 85

            submission = serializer.save(
                user=request.user,
                corrected_text=corrected,
                feedback=feedback,
                score=score
            )
            
            return Response(WritingSubmissionSerializer(submission).data, status=201)
        return Response(serializer.errors, status=400)
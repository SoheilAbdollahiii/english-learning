from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LearningPreference
from .serializers import LearningPreferenceSerializer


@api_view(["GET", "PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def learning_preferences(request):
    preferences, _ = LearningPreference.objects.get_or_create(user=request.user)
    if request.method == "GET":
        return Response(LearningPreferenceSerializer(preferences).data)

    serializer = LearningPreferenceSerializer(
        preferences,
        data=request.data,
        partial=request.method == "PATCH",
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

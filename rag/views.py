from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.throttles import ConversationThrottle
from .conversation import ConversationUnavailable, continue_conversation


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ConversationThrottle])
def conversation_turn(request):
    """Generate one level-aware role-play turn and concise learning feedback."""
    level = request.data.get("level")
    scenario = request.data.get("scenario")
    messages = request.data.get("messages")
    try:
        result = continue_conversation(level, scenario, messages)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except ConversationUnavailable as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(result, status=status.HTTP_200_OK)

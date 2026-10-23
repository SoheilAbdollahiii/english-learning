from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .throttles import LoginRateThrottle, RegistrationRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegistrationSerializer
from django.contrib.auth.decorators import login_required
from vocabulary.models import Word
from reading.models import Article

@login_required
def dashboard(request):
    # گرفتن تعداد لغات و مقالات از دیتابیس برای نمایش در داشبورد
    word_count = Word.objects.count()
    article_count = Article.objects.count()
    
    context = {
        'word_count': word_count,
        'article_count': article_count,
    }
    return render(request, 'dashboard.html', context)

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegistrationRateThrottle])
def register_learner(request):
    """Create a learner account and return JWTs so onboarding can continue immediately."""
    serializer = RegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh)},
        status=status.HTTP_201_CREATED,
    )


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Limit anonymous password attempts before issuing JWTs."""
    throttle_classes = [LoginRateThrottle]


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """Permanently delete the authenticated learner and their owned data."""
    password = request.data.get("password", "")
    confirmation = request.data.get("confirmation", "")
    if confirmation != "DELETE":
        return Response(
            {"confirmation": "Type DELETE to confirm account removal."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not password or not request.user.check_password(password):
        return Response(
            {"password": "Enter your current password to delete the account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

from django.contrib import messages
from django.core.cache import cache
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.conf import settings

from rag.services import CorrectionUnavailable, correct_writing
from .models import WritingSubmission
from .serializers import WritingSubmissionSerializer
from core.throttles import WritingCorrectionThrottle


MAX_CHARACTERS = 5000
MAX_DAILY_WEB_CORRECTIONS = 30


def _consume_html_correction_quota(user_id):
    """Apply a basic per-user daily cap to the legacy session-authenticated form."""
    key = f"writing-web-corrections:{user_id}:{timezone.localdate().isoformat()}"
    if cache.add(key, 1, timeout=86400):
        return True
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=86400)
        return True
    return count <= MAX_DAILY_WEB_CORRECTIONS


def _analyze_or_save_draft(text):
    """Use the LLM when configured; never fabricate correction or feedback."""
    try:
        analysis = correct_writing(text)
        return {**analysis, "ai_status": "corrected", "ai_error_code": None}
    except CorrectionUnavailable as exc:
        configured_key = (settings.GROQ_API_KEY or "").strip()
        placeholder_keys = {"your-groq-api-key", "your_groq_api_key", "replace-with-your-groq-api-key"}
        missing_key = not configured_key or configured_key.lower() in placeholder_keys
        error_code = "missing_api_key" if missing_key else getattr(exc, "code", "provider_error")
        return {
            "corrected_text": "",
            "feedback": (
                "AI correction is unavailable because GROQ_API_KEY is not configured with a real key."
                if missing_key else
                "AI correction is unavailable because the Groq provider request failed. Check server logs."
            ),
            "score": None,
            "ai_status": "unavailable",
            "ai_error_code": error_code,
        }


@login_required
@require_http_methods(["GET", "POST"])
def writing_submit(request):
    """Save a user's draft and attach real LLM feedback when the service is configured."""
    if request.method == "POST":
        original_text = request.POST.get("original_text", "").strip()
        if not original_text:
            messages.error(request, "Please enter a piece of writing before submitting.")
        elif len(original_text) > MAX_CHARACTERS:
            messages.error(request, "Your writing must be 5,000 characters or fewer.")
        elif not _consume_html_correction_quota(request.user.pk):
            messages.error(request, "Daily writing limit reached. Please try again tomorrow.")
        else:
            analysis = _analyze_or_save_draft(original_text)
            submission = WritingSubmission.objects.create(
                user=request.user,
                original_text=original_text,
                corrected_text=analysis["corrected_text"],
                feedback=analysis["feedback"],
                score=analysis["score"],
            )
            if analysis["corrected_text"]:
                messages.success(request, f"Writing corrected and saved (submission #{submission.pk}).")
            else:
                messages.warning(request, f"Draft saved as #{submission.pk}; AI correction is currently unavailable.")
            return redirect("writing_submit")

    submissions = WritingSubmission.objects.filter(user=request.user).order_by("-created_at")
    return render(
        request,
        "writing/submit.html",
        {
            "submissions": submissions,
            "submission_count": submissions.count(),
            "max_characters": MAX_CHARACTERS,
        },
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([WritingCorrectionThrottle])
def manage_writings(request):
    """JWT-authenticated API scoped to the authenticated user's submissions."""
    if request.method == "GET":
        writings = WritingSubmission.objects.filter(user=request.user).order_by("-created_at")
        return Response(WritingSubmissionSerializer(writings, many=True).data)

    serializer = WritingSubmissionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    original_text = serializer.validated_data.get("original_text", "").strip()
    if not original_text:
        return Response({"original_text": ["This field may not be blank."]}, status=400)
    if len(original_text) > MAX_CHARACTERS:
        return Response(
            {"original_text": ["Ensure this field has no more than 5000 characters."]},
            status=400,
        )

    analysis = _analyze_or_save_draft(original_text)
    submission = serializer.save(
        user=request.user,
        original_text=original_text,
        corrected_text=analysis["corrected_text"],
        feedback=analysis["feedback"],
        score=analysis["score"],
    )
    response_data = dict(WritingSubmissionSerializer(submission).data)
    response_data["ai_status"] = analysis["ai_status"]
    response_data["ai_error_code"] = analysis["ai_error_code"]
    return Response(response_data, status=201)

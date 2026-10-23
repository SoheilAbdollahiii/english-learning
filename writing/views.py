from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import WritingSubmission
from .serializers import WritingSubmissionSerializer


@login_required
@require_http_methods(["GET", "POST"])
def writing_submit(request):
    """Render the writing workspace and save submissions for the current user."""
    if request.method == "POST":
        original_text = request.POST.get("original_text", "").strip()

        if not original_text:
            messages.error(request, "Please enter a piece of writing before submitting.")
        elif len(original_text) > 5000:
            messages.error(request, "Your writing must be 5,000 characters or fewer.")
        else:
            submission = WritingSubmission.objects.create(
                user=request.user,
                original_text=original_text,
                corrected_text="",
                feedback=(
                    "Your writing has been saved. AI analysis is not available yet; "
                    "your text has not been automatically corrected."
                ),
                score=0,
            )
            messages.success(
                request,
                f"Writing saved successfully (submission #{submission.pk}).",
            )
            return redirect("writing_submit")

    submissions = WritingSubmission.objects.filter(user=request.user).order_by("-created_at")
    return render(
        request,
        "writing/submit.html",
        {
            "submissions": submissions,
            "submission_count": submissions.count(),
            "max_characters": 5000,
        },
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_writings(request):
    """JWT-authenticated API for a user's own writing submissions."""
    if request.method == "GET":
        writings = WritingSubmission.objects.filter(user=request.user).order_by("-created_at")
        serializer = WritingSubmissionSerializer(writings, many=True)
        return Response(serializer.data)

    serializer = WritingSubmissionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    original_text = serializer.validated_data.get("original_text", "").strip()
    if not original_text:
        return Response({"original_text": ["This field may not be blank."]}, status=400)
    if len(original_text) > 5000:
        return Response(
            {"original_text": ["Ensure this field has no more than 5000 characters."]},
            status=400,
        )

    submission = serializer.save(
        user=request.user,
        original_text=original_text,
        corrected_text="",
        feedback=(
            "Your writing has been saved. AI analysis is not available yet; "
            "your text has not been automatically corrected."
        ),
        score=0,
    )
    return Response(WritingSubmissionSerializer(submission).data, status=201)

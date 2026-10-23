"""Safely diagnose Groq configuration and model-list access without exposing secrets."""

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from groq import Groq


def classify_error(exc):
    """Return a short, non-sensitive diagnosis for common provider failures."""
    status = getattr(exc, "status_code", None)
    name = type(exc).__name__.lower()

    if status == 401 or "authentication" in name:
        return "Authentication failed (HTTP 401). Verify the key in the provider dashboard."
    if status == 403 or "permissiondenied" in name:
        return (
            "The provider denied access (HTTP 403). Check project/organization access, "
            "account restrictions, and whether this API key is authorized for the endpoint."
        )
    if status == 404 or "notfound" in name:
        return "The requested resource was not found (HTTP 404). Verify the API endpoint and model."
    if status == 429 or "ratelimit" in name:
        return "The provider rate limit was reached (HTTP 429). Check limits and retry later."
    if "timeout" in name:
        return "The provider request timed out. Check network access and provider availability."
    if "connection" in name or "connect" in name:
        return "Could not connect to the provider. Check DNS, proxy, firewall, and outbound HTTPS."
    return f"Provider check failed ({type(exc).__name__}). Inspect provider-side logs without sharing credentials."


class Command(BaseCommand):
    help = "Check Groq configuration and model-list access without printing API credentials."

    def handle(self, *args, **options):
        model = getattr(settings, "GROQ_MODEL", "").strip()
        api_key = getattr(settings, "GROQ_API_KEY", "").strip()

        self.stdout.write(f"Provider: Groq")
        self.stdout.write(f"Configured model: {model or '(empty)'}")
        self.stdout.write(f"API key configured: {'yes' if api_key else 'no'}")

        if not api_key:
            raise CommandError(
                "GROQ_API_KEY is not configured. Set it in your local environment or .env file."
            )
        if not model:
            raise CommandError("GROQ_MODEL is empty. Set it to a model enabled for this account.")

        try:
            client = Groq(api_key=api_key, timeout=10.0, max_retries=0)
            models = client.models.list()
        except Exception as exc:
            self.stderr.write(self.style.ERROR(classify_error(exc)))
            raise CommandError(
                "Groq model-list check failed. The diagnostic intentionally omits response bodies and secrets."
            ) from None

        model_ids = {getattr(item, "id", "") for item in getattr(models, "data", [])}
        if model in model_ids:
            self.stdout.write(self.style.SUCCESS("Model-list access succeeded; configured model is listed."))
            self.stdout.write(
                "Note: this verifies model-list access only, not that a writing-completion request will succeed."
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "Model-list access succeeded, but the configured model was not present in the returned list."
                )
            )
            self.stdout.write("Check the exact model identifier and the models enabled for this API key.")

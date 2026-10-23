from django.conf import settings


def frontend_url(request):
    """Expose the public React app URL to Django-rendered navigation."""
    return {"FRONTEND_URL": settings.FRONTEND_URL}

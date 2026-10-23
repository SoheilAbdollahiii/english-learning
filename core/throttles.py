from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegistrationRateThrottle(AnonRateThrottle):
    scope = "registration"


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class WritingCorrectionThrottle(UserRateThrottle):
    """Cap per-account AI writing calls to control cost and abuse."""
    scope = "writing_correction"

    def allow_request(self, request, view):
        if request.method != "POST":
            return True
        return super().allow_request(request, view)

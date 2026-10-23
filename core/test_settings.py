from .settings import *  # noqa: F403

# HTTP requests from Django's test client should not be redirected to HTTPS.
# Production security settings remain unchanged.
SECURE_SSL_REDIRECT = False
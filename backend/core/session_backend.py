"""
Custom session backend that handles concurrent deletes gracefully.
Used for OAuth flows where sessions might be deleted during request processing.
"""

from django.contrib.sessions.backends.cache import SessionStore as CacheSessionStore


class SessionStore(CacheSessionStore):
    """
    Custom cache-based session backend that handles UpdateError gracefully.
    Used specifically for OAuth flows where sessions might be deleted during request processing.
    """

    def save(self, must_create=False):
        """
        Override save to catch UpdateError and continue gracefully.
        This is needed for OAuth flows where the session might be deleted before save.
        """
        try:
            super().save(must_create=must_create)
        except Exception as e:
            # If we get an UpdateError or KeyError during save, it likely means
            # the session was deleted (e.g., during OAuth processing)
            # We can safely ignore this for stateless JWT auth
            error_name = e.__class__.__name__
            if 'UpdateError' in error_name or 'KeyError' in error_name:
                # Session was already deleted or doesn't exist - that's fine for OAuth
                pass
            else:
                # Re-raise other exceptions
                raise

    def delete(self, session_key=None):
        """
        Override delete to handle cases where session doesn't exist.
        """
        try:
            super().delete(session_key)
        except Exception:
            # Ignore delete errors - session might not exist
            pass

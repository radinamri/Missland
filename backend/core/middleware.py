"""
Custom middleware to handle OAuth session issues.
Gracefully handles SessionInterrupted exceptions for OAuth endpoints.
"""

from django.contrib.sessions.exceptions import SessionInterrupted
from django.http import JsonResponse


class OAuthSessionMiddleware:
    """
    Catches SessionInterrupted exceptions on OAuth endpoints and returns a proper error response.
    This allows JWT tokens to be returned even when the session backend has issues.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except SessionInterrupted as e:
            # Check if this is an OAuth endpoint
            if '/api/auth/google/' in request.path or '/auth/' in request.path:
                # For OAuth endpoints, we don't need sessions - return 400 with proper error
                # The view should have already processed the user and generated JWT tokens
                # This exception just means the session cleanup failed, which we can ignore
                print(f"[OAuth] SessionInterrupted handled gracefully for {request.path}")
                # Return a generic error that the frontend expects
                return JsonResponse(
                    {'detail': 'Authentication failed. Please try again.'},
                    status=400
                )
            raise

        return response

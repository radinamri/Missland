"""
Custom token views for multi-device authentication.
Handles session creation on login and validates sessions.
"""

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from .auth_utils import SessionManager
from .models import UserSession


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer that includes device information in token response.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims if needed
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain view that:
    1. Authenticates user
    2. Creates a new session/device entry
    3. Returns tokens with session ID
    
    This ensures users can be logged in from multiple devices simultaneously
    and we track which token belongs to which device.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Call parent to authenticate and get tokens
        response = super().post(request, *args, **kwargs)
        
        # If authentication was successful, create a session
        if response.status_code == status.HTTP_200_OK:
            user = self.request.user
            
            # Create a new session for this login
            session = SessionManager.create_device_session(user, request)
            
            # Add session ID to response so frontend can store it
            response.data['session_id'] = str(session.session_id)
            response.data['device_name'] = session.device_name
            response.data['device_type'] = session.device_type
        
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom refresh view that:
    1. Validates the session is still active
    2. Updates session activity timestamp
    3. Issues new tokens
    """

    def post(self, request, *args, **kwargs):
        # Get session ID from request headers
        session_id = request.META.get('HTTP_X_SESSION_ID')
        
        # If session ID provided, validate it's still active
        if session_id:
            try:
                session = UserSession.objects.get(session_id=session_id, is_active=True)
                # Update last activity
                from django.utils.timezone import now
                session.last_activity_at = now()
                session.save(update_fields=['last_activity_at'])
            except UserSession.DoesNotExist:
                return Response(
                    {'detail': 'Session is no longer active. Please log in again.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        # Call parent to refresh tokens
        response = super().post(request, *args, **kwargs)
        
        # Include session ID in response
        if session_id:
            response.data['session_id'] = session_id
        
        return response

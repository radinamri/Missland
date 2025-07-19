from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer
from .models import User
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView


class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration.
    Allows any user (even unauthenticated) to create a new account.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": {
                    "email": user.email,
                    "username": user.username
                },
                "message": "User created successfully. You can now log in.",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLogin(SocialLoginView):
    """
    Handles Google login via a POST request containing an access_token from Google.
    Returns JWT tokens upon successful authentication.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:3000'  # Can be any valid URL for this flow
    client_class = OAuth2Client


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view to retrieve or update the profile of the currently authenticated user.
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        Return the appropriate serializer class based on the request method.
        """
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        """
        Overrides the default get_object method to return the
        user associated with the current request.
        """
        return self.request.user

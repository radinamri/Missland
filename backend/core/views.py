from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer, \
    EmailChangeInitiateSerializer, EmailChangeConfirmSerializer, PostSerializer, ArticleListSerializer, \
    ArticleDetailSerializer
from .models import User, Post, Article
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework.views import APIView


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


class EmailChangeInitiateView(APIView):
    """
    Initiates the email change process.
    Receives a new email address, sends a verification link to it.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = EmailChangeInitiateSerializer(data=request.data)
        if serializer.is_valid():
            new_email = serializer.validated_data['new_email']
            user = request.user

            # Generate a token and a user ID encoded in base64
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # Create the verification link for the frontend
            # The frontend will have a page at /verify-email-change to handle this
            verification_link = f"{settings.CORS_ALLOWED_ORIGINS[0]}/verify-email-change?uid={uid}&token={token}&email={new_email}"

            # Send the email
            send_mail(
                'Verify your new email address for NANA-AI',
                f'Please click the link to confirm your new email address: {verification_link}',
                'noreply@nana-ai.com',
                [new_email],
                fail_silently=False,
            )

            return Response({'detail': 'Verification link sent to your new email address.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailChangeConfirmView(APIView):
    """
    Confirms the email change using the token from the verification link.
    """
    permission_classes = [AllowAny]  # Anyone with the link can access this

    def post(self, request, *args, **kwargs):
        serializer = EmailChangeConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uidb64 = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_email = request.data.get('email')  # Get email from the request body

            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user is not None and default_token_generator.check_token(user, token):
                # Token is valid, update the user's email
                user.email = new_email
                user.username = new_email  # Also update the username to match
                user.save()
                return Response({'detail': 'Email address successfully changed.'}, status=status.HTTP_200_OK)
            else:
                # Invalid token
                return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostListView(generics.ListAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [AllowAny]


class ToggleSavePostView(APIView):
    """
    Toggles the saved state of a post for the current user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, *args, **kwargs):
        try:
            post = Post.objects.get(id=post_id)
            user = request.user

            if user in post.saved_by.all():
                # User has already saved this post, so unsave it
                post.saved_by.remove(user)
                message = 'Post unsaved successfully.'
            else:
                # User has not saved this post, so save it
                post.saved_by.add(user)
                message = 'Post saved successfully.'

            return Response({'detail': message}, status=status.HTTP_200_OK)

        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class SavedPostsListView(generics.ListAPIView):
    """
    Returns a list of all posts saved by the currently authenticated user.
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the posts
        that have been saved by the currently authenticated user.
        """
        user = self.request.user
        return user.saved_posts.all().order_by('-created_at')


class ArticleListView(generics.ListAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleListSerializer
    permission_classes = [AllowAny]


class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'  # Use the slug to find the article


class PostDetailView(generics.RetrieveAPIView):
    """
    API view to retrieve a single post by its ID.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    # The lookup field 'pk' (primary key) is used by default, which matches <int:pk> in the URL

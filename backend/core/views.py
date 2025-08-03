import random
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer, \
    EmailChangeInitiateSerializer, EmailChangeConfirmSerializer, PostSerializer, ArticleListSerializer, \
    ArticleDetailSerializer, UserDeleteSerializer
from .models import User, Post, Article, InterestProfile
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework.views import APIView
from itertools import chain


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
    Toggles the saved state of a post for the current user and updates
    their interest profile based on the post's tags.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, *args, **kwargs):
        try:
            post = Post.objects.get(id=post_id)
            user = request.user

            # Get or create the user's interest profile
            # The signal handles creation, but 'get_or_create' is a safe fallback.
            profile, created = InterestProfile.objects.get_or_create(user=user)

            # The amount to change the score by
            score_change = 0

            if user in post.saved_by.all():
                # User is UNSAVING the post
                post.saved_by.remove(user)
                score_change = -1  # Decrease score
                message = 'Post unsaved successfully.'
            else:
                # User is SAVING the post
                post.saved_by.add(user)
                score_change = 1  # Increase score
                message = 'Post saved successfully.'

            # --- This is the new logic to update the interest profile ---
            if post.tags and isinstance(post.tags, dict):
                for category, tag_value in post.tags.items():
                    if tag_value:  # Ensure the tag value is not empty
                        # Get the current score for this tag, default to 0 if it doesn't exist
                        current_score = profile.tag_scores.get(tag_value, 0)
                        # Calculate the new score, ensuring it doesn't go below zero
                        new_score = max(0, current_score + score_change)
                        # Update the score in the dictionary
                        profile.tag_scores[tag_value] = new_score

                # Save the updated profile
                profile.save()

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

        We explicitly fetch the user from the database to ensure we have the
        most up-to-date version of their saved posts relationship.
        """
        user = User.objects.get(pk=self.request.user.pk)
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


class UserDeleteView(generics.GenericAPIView):
    """
    Handles the deletion of the currently authenticated user's account.
    Requires re-authentication via password or Google token.
    """
    serializer_class = UserDeleteSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.delete()

        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class MorePostsView(generics.ListAPIView):
    """
    Returns a random selection of posts, excluding a specified post ID.
    """
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Get the post ID to exclude from the URL
        exclude_id = self.kwargs.get('post_id')
        # Get all post IDs, excluding the current one
        all_other_post_ids = list(Post.objects.exclude(id=exclude_id).values_list('id', flat=True))

        # Get a random sample of 20 IDs (or fewer if not enough posts exist)
        sample_size = min(len(all_other_post_ids), 20)
        random_ids = random.sample(all_other_post_ids, sample_size)

        # Return the queryset for the randomly selected posts
        return Post.objects.filter(id__in=random_ids)


class ForYouPostListView(generics.ListAPIView):
    """
    Generates a personalized "For You" feed for authenticated users,
    or a generic feed for guests.
    """
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        feed_size = 40

        # --- Fallback Logic: For guests or users with no interactions ---
        if not user.is_authenticated or not hasattr(user, 'interest_profile') or not user.interest_profile.tag_scores:
            return Post.objects.all().order_by('-created_at')[:feed_size]

        # --- Personalization Logic: For users with interactions ---
        try:
            profile = user.interest_profile
            tag_scores = profile.tag_scores

            if not tag_scores:
                return Post.objects.all().order_by('-created_at')[:feed_size]

            # --- This is the corrected part that works with SQLite ---
            # We fetch all posts and then score and sort them in Python.
            all_posts = list(Post.objects.all())

            scored_posts = []
            for post in all_posts:
                relevance_score = 0
                if isinstance(post.tags, list):
                    for tag in post.tags:
                        # Add the score for each matching tag
                        relevance_score += tag_scores.get(tag, 0)

                if relevance_score > 0:
                    scored_posts.append({'post': post, 'score': relevance_score})

            # Sort the posts by their calculated relevance score, highest first
            scored_posts.sort(key=lambda x: x['score'], reverse=True)

            # Extract the sorted Post objects
            personalized_posts = [item['post'] for item in scored_posts]

            # --- Content Blending: Ensure the feed is always full ---
            if len(personalized_posts) < feed_size:
                existing_ids = [p.id for p in personalized_posts]
                recent_posts = Post.objects.exclude(id__in=existing_ids).order_by('-created_at')

                # Combine the two lists
                combined_posts = list(chain(personalized_posts, recent_posts))
                return combined_posts[:feed_size]

            return personalized_posts[:feed_size]

        except InterestProfile.DoesNotExist:
            return Post.objects.all().order_by('-created_at')[:feed_size]


class TrackPostClickView(APIView):
    """
    Tracks when a user clicks on a post to view its details.
    This is an implicit signal of interest.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        if not post_id:
            return Response({'detail': 'Post ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            post = Post.objects.get(id=post_id)
            user = request.user
            profile, created = InterestProfile.objects.get_or_create(user=user)

            # A click is a weaker signal than a save, so we increment by a smaller amount.
            score_change = 0.1

            if post.tags and isinstance(post.tags, list):
                for tag in post.tags:
                    if tag:
                        current_score = profile.tag_scores.get(tag, 0)
                        profile.tag_scores[tag] = current_score + score_change

                profile.save()

            # Return 204 No Content as the frontend doesn't need a response body.
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class TrackSearchQueryView(APIView):
    """
    Tracks the search terms a user enters.
    This is a strong signal of interest.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get('query')
        if not query:
            return Response({'detail': 'Query is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        profile, created = InterestProfile.objects.get_or_create(user=user)

        # A search is a strong signal, so we increment by a larger amount.
        score_change = 0.5

        # Simple tokenization: split the query into words
        search_terms = query.lower().split()

        # For each word in the search, if it's a known tag, increase its score
        # In a more advanced system, you'd check against a predefined dictionary of all possible tags.
        for term in search_terms:
            # This is a simple check. A real system would be more sophisticated.
            if term in profile.tag_scores:
                profile.tag_scores[term] += score_change
            else:
                # We can also add new tags found via search, with an initial score
                profile.tag_scores[term] = score_change

        profile.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

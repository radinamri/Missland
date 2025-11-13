# core/views.py

import random
import time
from itertools import chain
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .models import User, Post, Article, InterestProfile, Collection, TryOn
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer,
    EmailChangeInitiateSerializer, EmailChangeConfirmSerializer, PostSerializer,
    ArticleListSerializer, ArticleDetailSerializer, UserDeleteSerializer, CollectionDetailSerializer,
    CollectionCreateSerializer, CollectionListSerializer, TryOnSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .keyword_extractor import extract_nail_keywords
from .color_constants import COLOR_SIMPLIFICATION_MAP
from functools import reduce
import operator


# --- HELPER FUNCTION ---
def get_tags_from_post(post):
    tags = []
    if post.shape: tags.append(post.shape)
    if post.pattern: tags.append(post.pattern)
    if post.size: tags.append(post.size)
    if post.colors and isinstance(post.colors, list):
        tags.extend(post.colors)
    return list(set(tags))


# --- CORRECT ORDER: PAGINATION CLASS DEFINED FIRST ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 100


# --- AUTH & PROFILE VIEWS ---

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"user": {"email": user.email, "username": user.username},
                             "message": "User created successfully. You can now log in."},
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:3000'
    client_class = OAuth2Client


class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']: return UserProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self): return self.request.user


class EmailChangeInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = EmailChangeInitiateSerializer(data=request.data)
        if serializer.is_valid():
            new_email = serializer.validated_data['new_email']
            user = request.user
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            verification_link = f"{settings.CORS_ALLOWED_ORIGINS[0]}/verify-email-change?uid={uid}&token={token}&email={new_email}"
            send_mail('Verify your new email address for NANA-AI',
                      f'Please click the link to confirm your new email address: {verification_link}',
                      'noreply@nana-ai.com', [new_email], fail_silently=False)
            return Response({'detail': 'Verification link sent to your new email address.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailChangeConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = EmailChangeConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uidb64 = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_email = request.data.get('email')
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None
            if user is not None and default_token_generator.check_token(user, token):
                user.email = new_email
                user.username = new_email
                user.save()
                return Response({'detail': 'Email address successfully changed.'}, status=status.HTTP_200_OK)
            else:
                return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDeleteView(generics.GenericAPIView):
    serializer_class = UserDeleteSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.delete()
        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# --- POST & FEED VIEWS ---

class FilteredPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Post.objects.all()
        query = self.request.query_params.get('q', None)
        shape = self.request.query_params.get('shape', None)
        pattern = self.request.query_params.get('pattern', None)
        size = self.request.query_params.get('size', None)
        color_query = self.request.query_params.get('color', None)

        color_query = self.request.query_params.get('color', None)

        query_filters = Q()

        if query:
            # Use the extractor to get structured keywords and any leftover text
            extracted_keywords, remaining_query = extract_nail_keywords(query)

            # Apply filters based on the keywords extracted from the text query
            if extracted_keywords.get('shape'):
                query_filters &= Q(shape__iexact=extracted_keywords['shape'])

            if extracted_keywords.get('pattern'):
                query_filters &= Q(pattern__iexact=extracted_keywords['pattern'])

            if extracted_keywords.get('size'):
                query_filters &= Q(size__iexact=extracted_keywords['size'])

            # Special handling for the extracted color to find all its variants
            if extracted_keywords.get('color'):
                base_color = extracted_keywords['color']
                color_q = Q()
                # Find all variants in the map that belong to the same base color family
                variants_to_find = {
                    variant for variant, base in COLOR_SIMPLIFICATION_MAP.items()
                    if base == base_color
                }
                for variant in variants_to_find:
                    color_q |= Q(colors__icontains=variant)
                query_filters &= color_q

            # Use the remaining text for a general title search
            if remaining_query:
                # This handles leftover words like "nails", "design", "art", etc.
                for term in remaining_query.split():
                    query_filters &= Q(title__icontains=term)

        # This part handles direct filter parameters from the frontend (e.g., ?shape=coffin from a pill click).
        # These are combined with any filters derived from the text search.
        if shape:
            query_filters &= Q(shape__iexact=shape)
        if pattern:
            query_filters &= Q(pattern__iexact=pattern)
        if size:
            query_filters &= Q(size__iexact=size)

        # Color logic to handle multi-select OR queries
        if color_query:
            colors = [c.strip() for c in color_query.lower().split(',')]
            base_colors_to_find = set()
            for c in colors:
                base_color = COLOR_SIMPLIFICATION_MAP.get(c.replace(' ', '_'), c)
                base_colors_to_find.add(base_color)

            color_master_q = Q()
            if base_colors_to_find:
                # Find all variants for all the base colors requested
                variants_to_search = {
                    variant for variant, base in COLOR_SIMPLIFICATION_MAP.items()
                    if base in base_colors_to_find
                }
                # Also include the base colors themselves
                variants_to_search.update(base_colors_to_find)

                # Build a single, powerful OR query
                or_conditions = [Q(colors__icontains=variant) for variant in variants_to_search]
                if or_conditions:
                    color_master_q = reduce(operator.or_, or_conditions)

            if color_master_q:
                query_filters &= color_master_q

        if query_filters:
            # Use .distinct() to avoid duplicate results if a post matches multiple criteria
            return queryset.filter(query_filters).distinct().order_by('-created_at')

        # If no query or filters were provided, return the default unfiltered list
        return queryset.order_by('-created_at')


class ForYouPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        try:
            tag_scores = user.interest_profile.tag_scores
            if not tag_scores: raise InterestProfile.DoesNotExist
            all_posts = list(Post.objects.all())
            scored_posts = []
            for post in all_posts:
                score = 0
                post_tags = get_tags_from_post(post)
                for tag in post_tags:
                    score += tag_scores.get(tag, 0)
                if score > 0:
                    scored_posts.append({'post': post, 'score': score})
            scored_posts.sort(key=lambda x: x['score'], reverse=True)
            return [item['post'] for item in scored_posts]
        except (InterestProfile.DoesNotExist, AttributeError):
            return Post.objects.all().order_by('?')


class MorePostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        exclude_id = self.kwargs.get('post_id')

        # --- HIGHLIGHT: INCREASED THE DESIRED FEED SIZE ---
        feed_size = 48

        random.seed(int(time.time()))

        try:
            current_post = Post.objects.get(id=exclude_id)
            q_objects = Q()
            if current_post.shape: q_objects |= Q(shape=current_post.shape)
            if current_post.pattern: q_objects |= Q(pattern=current_post.pattern)
            if current_post.colors:
                for color in current_post.colors: q_objects |= Q(colors__contains=color)

            base_queryset = Post.objects.exclude(id=exclude_id)

            relevant_posts = []
            if q_objects:
                # Find all relevant posts and shuffle them
                relevant_posts = list(base_queryset.filter(q_objects).distinct())
                random.shuffle(relevant_posts)

            # --- HIGHLIGHT: NEW FALLBACK LOGIC ---
            # Check if we have enough relevant posts to fill the feed
            if len(relevant_posts) < feed_size:
                # If not, we need to get some filler posts

                # First, get the IDs of the posts we've already selected
                existing_ids = {p.id for p in relevant_posts}
                existing_ids.add(exclude_id)

                # Calculate how many filler posts we need
                needed = feed_size - len(relevant_posts)

                # Get random posts from the rest of the database
                filler_posts = list(Post.objects.exclude(id__in=existing_ids).order_by('?')[:needed])

                # Combine the relevant posts with the filler posts
                return relevant_posts + filler_posts
            else:
                # If we have enough relevant posts, just return a slice of them
                return relevant_posts[:feed_size]

        except Post.DoesNotExist:
            # Fallback if the original post doesn't exist for some reason
            return Post.objects.exclude(id=exclude_id).order_by('?')[:feed_size]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'seed': int(time.time()), 'results': serializer.data})


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]


class PostListView(generics.ListAPIView):  # This is likely a legacy/unused view but included for safety
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        seed = int(time.time())
        random.seed(seed)
        all_posts = list(Post.objects.all())
        random.shuffle(all_posts)
        paginated_posts = all_posts[:40]
        serializer = self.get_serializer(paginated_posts, many=True)
        return Response({'seed': seed, 'results': serializer.data})


# --- TRACKING VIEWS ---

class TrackPostClickView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        try:
            post = Post.objects.get(id=post_id)
            profile, _ = InterestProfile.objects.get_or_create(user=request.user)
            post_tags = get_tags_from_post(post)
            for tag in post_tags:
                profile.tag_scores[tag] = profile.tag_scores.get(tag, 0) + 0.1
            profile.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class TrackSearchQueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get('query')
        if not query: return Response({'detail': 'Query is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        profile, created = InterestProfile.objects.get_or_create(user=user)
        score_change = 0.5
        for term in query.lower().split():
            profile.tag_scores[term] = profile.tag_scores.get(term, 0) + score_change
        profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TrackTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        try:
            post = Post.objects.get(id=post_id)
            profile, _ = InterestProfile.objects.get_or_create(user=request.user)
            post_tags = get_tags_from_post(post)
            for tag in post_tags:
                profile.tag_scores[tag] = profile.tag_scores.get(tag, 0) + 1.5
            profile.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


# --- ARTICLE, COLLECTION, and other specific views ---

class ArticleListView(generics.ListAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleListSerializer
    permission_classes = [AllowAny]


class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class CollectionListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST': return CollectionCreateSerializer
        return CollectionListSerializer

    def get_queryset(self):
        return self.request.user.collections.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionDetailSerializer

    def get_queryset(self):
        return self.request.user.collections.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']: return CollectionCreateSerializer
        return CollectionDetailSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.name == "All Posts":
            return Response({"detail": "The default 'All Posts' collection cannot be deleted."},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class ManagePostInCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, collection_id, post_id, *args, **kwargs):
        try:
            collection = request.user.collections.get(id=collection_id)
            post = Post.objects.get(id=post_id)
            if post in collection.posts.all():
                collection.posts.remove(post)
                message = f'Post removed from {collection.name}.'
            else:
                collection.posts.add(post)
                message = f'Post saved to {collection.name}.'
            default_collection, _ = request.user.collections.get_or_create(name="All Posts")
            if default_collection.id != collection.id and post not in default_collection.posts.all():
                default_collection.posts.add(post)
            return Response({'detail': message}, status=status.HTTP_200_OK)
        except Collection.DoesNotExist:
            return Response({'detail': 'Collection not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class PublicPostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]


class SaveTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, *args, **kwargs):
        try:
            post = Post.objects.get(id=post_id)
            try_on, created = TryOn.objects.get_or_create(user=request.user, post=post)
            if created:
                return Response({'detail': 'Saved to My Try-Ons.'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'detail': 'Already in My Try-Ons.'}, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class MyTryOnsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TryOnSerializer

    def get_queryset(self):
        return self.request.user.try_ons.all()


class DeleteTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, try_on_id, *args, **kwargs):
        try:
            try_on = request.user.try_ons.get(id=try_on_id)
            try_on.delete()
            return Response({"detail": "Removed from My Try-Ons."}, status=status.HTTP_204_NO_CONTENT)
        except TryOn.DoesNotExist:
            return Response({"detail": "Try-on not found."}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email__iexact=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.CORS_ALLOWED_ORIGINS[0]}/reset-password?uid={uid}&token={token}"
            send_mail('Reset Your Password for Misland', f'Please click the link to reset your password: {reset_link}',
                      'noreply@misland.com', [email], fail_silently=False)
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If an account with that email exists, a password reset link has been sent.'},
                        status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        uidb64 = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password1']
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)


class FilterSuggestionsView(APIView):
    """
    Provides a static list of curated filter suggestions for the frontend.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        suggestions = {
            "shapes": ["square", "almond", "coffin", "stiletto"],
            "patterns": ["french", "ombre", "glossy", "matte", "mixed"],
            "sizes": ["short", "medium", "long"],
            "colors": ["red", "pink", "orange", "yellow", "green", "turquoise", "blue", "purple", "cream", "brown",
                       "white", "gray", "black"]
        }
        return Response(suggestions)

# core/views.py

import random
import time
import logging
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
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .models import User, Post, Article, InterestProfile, Collection, TryOn
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer,
    EmailChangeInitiateSerializer, EmailChangeConfirmSerializer, PostSerializer,
    ArticleListSerializer, ArticleDetailSerializer, UserDeleteSerializer, CollectionDetailSerializer,
    CollectionCreateSerializer, CollectionListSerializer, TryOnSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserSerializer
)
from .keyword_extractor import extract_nail_keywords
from .color_constants import COLOR_SIMPLIFICATION_MAP

logger = logging.getLogger(__name__)
from . import db_utils
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
    page_size = 48
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

class FilteredPostListView(APIView):
    """
    Text-based search endpoint with intelligent fallback.
    
    GET /api/auth/posts/filter/
    
    If MongoDB is enabled and results < 10, automatically triggers
    similarity search from nail search microservice.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        # Get query parameters
        query = request.query_params.get('q', None)
        shape = request.query_params.get('shape', None)
        pattern = request.query_params.get('pattern', None)
        size = request.query_params.get('size', None)
        color_query = request.query_params.get('color', None)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 48))
        
        # Enable fallback for MongoDB (defaults to True for better UX)
        enable_fallback = request.query_params.get('fallback', 'true').lower() == 'true'

        # Use db_utils to route to appropriate database with fallback
        result = db_utils.filter_posts(
            q=query,
            shape=shape,
            pattern=pattern,
            size=size,
            color=color_query,
            page=page,
            page_size=page_size,
            enable_fallback=enable_fallback
        )
        
        return Response(result, status=status.HTTP_200_OK)


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


class MorePostsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, post_id, *args, **kwargs):
        feed_size = 48
        random.seed(int(time.time()))
        
        # Use db_utils for MongoDB/PostgreSQL routing
        if getattr(settings, 'USE_MONGODB', False):
            similar_posts = db_utils.get_similar_posts(str(post_id), count=feed_size)
            return Response({'seed': int(time.time()), 'results': similar_posts})
        
        # PostgreSQL implementation
        exclude_id = post_id

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

            if len(relevant_posts) < feed_size:
                existing_ids = {p.id for p in relevant_posts}
                existing_ids.add(exclude_id)
                needed = feed_size - len(relevant_posts)
                filler_posts = list(Post.objects.exclude(id__in=existing_ids).order_by('?')[:needed])
                queryset = relevant_posts + filler_posts
            else:
                queryset = relevant_posts[:feed_size]
            
            serializer = PostSerializer(queryset, many=True)
            return Response({'seed': int(time.time()), 'results': serializer.data})

        except Post.DoesNotExist:
            queryset = Post.objects.exclude(id=exclude_id).order_by('?')[:feed_size]
            serializer = PostSerializer(queryset, many=True)
            return Response({'seed': int(time.time()), 'results': serializer.data})


class PostDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        post_data = db_utils.get_post_by_id(str(pk))
        if post_data:
            return Response(post_data, status=status.HTTP_200_OK)
        return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


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


class CollectionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        result = db_utils.get_user_collections(request.user.id, page, page_size)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = CollectionCreateSerializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data['name']
            collection_id = db_utils.create_collection(request.user.id, name)
            if collection_id:
                return Response({'id': collection_id, 'name': name}, status=status.HTTP_201_CREATED)
            return Response({'detail': 'Collection with this name already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollectionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        collection_data = db_utils.get_collection_detail(str(pk))
        if collection_data:
            return Response(collection_data, status=status.HTTP_200_OK)
        return Response({'detail': 'Collection not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk, *args, **kwargs):
        collection_data = db_utils.get_collection_detail(str(pk))
        if collection_data and collection_data.get('name') == "All Posts":
            return Response({"detail": "The default 'All Posts' collection cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)
        # Delete using PostgreSQL for now (MongoDB delete can be added later)
        try:
            collection = request.user.collections.get(id=pk)
            collection.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Collection.DoesNotExist:
            return Response({'detail': 'Collection not found.'}, status=status.HTTP_404_NOT_FOUND)


class ManagePostInCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, collection_id, post_id, *args, **kwargs):
        collection_data = db_utils.get_collection_detail(str(collection_id))
        if not collection_data:
            return Response({'detail': 'Collection not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        post_data = db_utils.get_post_by_id(str(post_id))
        if not post_data:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        post_ids = [str(p.get('id')) for p in collection_data.get('posts', [])]
        is_in_collection = str(post_id) in post_ids
        
        if is_in_collection:
            success = db_utils.remove_post_from_collection(str(collection_id), str(post_id))
            message = f'Post removed from {collection_data["name"]}.'
        else:
            success = db_utils.add_post_to_collection(str(collection_id), str(post_id))
            message = f'Post saved to {collection_data["name"]}.'
            if collection_data['name'] != "All Posts":
                all_posts_id = db_utils.create_collection(request.user.id, "All Posts")
                if all_posts_id:
                    db_utils.add_post_to_collection(all_posts_id, str(post_id))
        
        if success:
            return Response({'detail': message}, status=status.HTTP_200_OK)
        return Response({'detail': 'Operation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicPostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]


class SaveTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, *args, **kwargs):
        post_data = db_utils.get_post_by_id(str(post_id))
        if not post_data:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        tryon_id = db_utils.create_tryon(request.user.id, str(post_id))
        if tryon_id:
            return Response({'detail': 'Saved to My Try-Ons.'}, status=status.HTTP_201_CREATED)
        return Response({'detail': 'Failed to save try-on.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyTryOnsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 48))
        result = db_utils.get_user_tryons(request.user.id, page, page_size)
        return Response(result, status=status.HTTP_200_OK)


class DeleteTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, try_on_id, *args, **kwargs):
        success = db_utils.delete_tryon(str(try_on_id))
        if success:
            return Response({"detail": "Removed from My Try-Ons."}, status=status.HTTP_204_NO_CONTENT)
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


class LogoutView(APIView):
    """
    Logout endpoint that blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(generics.RetrieveAPIView):
    """
    Get current authenticated user info with role.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# ==================== NAIL SEARCH MICROSERVICE PROXY VIEWS ====================

class NailClassifyView(APIView):
    """
    Proxy endpoint for nail image classification.
    
    POST /api/nails/classify
    
    Accepts:
    - multipart/form-data with 'image' file
    - JSON with 'imageUrl' string
    
    Returns classification: {pattern, shape, size, colors}
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            from .nail_search_client import get_nail_search_client
            
            nail_client = get_nail_search_client()
            
            # Check if image file was uploaded
            image_file = request.FILES.get('image')
            image_url = request.data.get('imageUrl')
            
            if not image_file and not image_url:
                return Response(
                    {
                        'success': False,
                        'error': 'Either image file or imageUrl must be provided'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Health check
            if not nail_client.health_check():
                return Response(
                    {
                        'success': False,
                        'error': 'Nail search service is currently unavailable'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Call microservice
            if image_file:
                result = nail_client.classify_nail_image(image=image_file)
            else:
                result = nail_client.classify_nail_image(image_url=image_url)
            
            if not result:
                return Response(
                    {
                        'success': False,
                        'error': 'Classification failed'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in NailClassifyView: {e}")
            return Response(
                {
                    'success': False,
                    'error': 'Internal server error',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NailSimilarSearchView(APIView):
    """
    Proxy endpoint for finding similar nails.
    
    POST /api/nails/search/similar
    
    Accepts:
    - multipart/form-data with 'image' file and query params
    - JSON with 'id' (nail ObjectId) and optional filters
    
    Returns similar nails ranked by similarity score.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            from .nail_search_client import get_nail_search_client
            
            nail_client = get_nail_search_client()
            
            # Extract parameters
            image_file = request.FILES.get('image')
            nail_id = request.data.get('id')
            limit = int(request.data.get('limit', 10))
            threshold = float(request.data.get('threshold', 0.7))
            match_fields = int(request.data.get('matchFields', 2))
            exclude_ids = request.data.get('excludeIds', '')
            
            if not image_file and not nail_id:
                return Response(
                    {
                        'success': False,
                        'error': 'Either image file or nail id must be provided'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Health check
            if not nail_client.health_check():
                return Response(
                    {
                        'success': False,
                        'error': 'Nail search service is currently unavailable'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Parse exclude_ids
            exclude_list = None
            if exclude_ids:
                if isinstance(exclude_ids, str):
                    exclude_list = [x.strip() for x in exclude_ids.split(',') if x.strip()]
                elif isinstance(exclude_ids, list):
                    exclude_list = exclude_ids
            
            # Call microservice
            if image_file:
                result = nail_client.find_similar(
                    image=image_file,
                    limit=limit,
                    threshold=threshold,
                    exclude_ids=exclude_list,
                    match_fields=match_fields
                )
            else:
                result = nail_client.find_similar(
                    nail_id=nail_id,
                    limit=limit,
                    threshold=threshold,
                    exclude_ids=exclude_list,
                    match_fields=match_fields
                )
            
            if not result:
                return Response(
                    {
                        'success': False,
                        'error': 'Similarity search failed'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {
                    'success': False,
                    'error': 'Invalid parameter',
                    'message': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in NailSimilarSearchView: {e}")
            return Response(
                {
                    'success': False,
                    'error': 'Internal server error',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NailClassifyAndSearchView(APIView):
    """
    Combined endpoint: Classify a new image and search for similar nails.
    
    POST /api/nails/classify-and-search
    
    Accepts:
    - multipart/form-data with 'image' file
    - JSON with 'imageUrl' string
    
    Returns:
    - classification results
    - search results based on classified attributes
    - newly created post ID (saved to MongoDB)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            # Check if MongoDB is enabled
            if not getattr(settings, 'USE_MONGODB', False):
                return Response(
                    {
                        'success': False,
                        'error': 'MongoDB must be enabled for this feature'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            image_file = request.FILES.get('image')
            image_url = request.data.get('imageUrl')
            page = int(request.data.get('page', 1))
            page_size = int(request.data.get('page_size', 48))
            
            if not image_file and not image_url:
                return Response(
                    {
                        'success': False,
                        'error': 'Either image file or imageUrl must be provided'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # If image file, we need to upload it somewhere first
            # For now, assume we have image_url or handle file upload
            if image_file and not image_url:
                return Response(
                    {
                        'success': False,
                        'error': 'Image file upload not yet implemented. Please provide imageUrl.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use async MongoDB manager
            from .db_utils import _use_mongodb, get_mongo_manager
            import asyncio
            
            if _use_mongodb():
                mongo_manager = get_mongo_manager()
                loop = asyncio.get_event_loop()
                
                result = loop.run_until_complete(
                    mongo_manager.classify_and_search(
                        image_url=image_url,
                        page=page,
                        page_size=page_size
                    )
                )
                
                if result.get('success'):
                    return Response(result, status=status.HTTP_200_OK)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response(
                    {
                        'success': False,
                        'error': 'MongoDB is not enabled'
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
        except Exception as e:
            logger.error(f"Error in NailClassifyAndSearchView: {e}")
            return Response(
                {
                    'success': False,
                    'error': 'Internal server error',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

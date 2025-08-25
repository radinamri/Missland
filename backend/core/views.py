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
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .models import User, Post, Article, InterestProfile, Collection
from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer, UserProfileUpdateSerializer,
    EmailChangeInitiateSerializer, EmailChangeConfirmSerializer, PostSerializer,
    ArticleListSerializer, ArticleDetailSerializer, UserDeleteSerializer, CollectionDetailSerializer,
    CollectionCreateSerializer, CollectionListSerializer
)


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

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user


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


class PostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        # 1. Get seed from query params, or generate a new one
        seed_param = request.query_params.get('seed')
        if seed_param:
            seed = int(seed_param)
        else:
            seed = int(time.time())

        # 2. Seed the random number generator to make the shuffle repeatable
        random.seed(seed)

        # 3. Get all posts and shuffle them
        all_posts = list(Post.objects.all())
        random.shuffle(all_posts)

        # 4. Take a slice for the feed size
        feed_size = 40
        paginated_posts = all_posts[:feed_size]
        serializer = self.get_serializer(paginated_posts, many=True)

        # 5. Return the posts in the new format that the frontend expects
        return Response({
            'seed': seed,
            'results': serializer.data
        })


class ArticleListView(generics.ListAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleListSerializer
    permission_classes = [AllowAny]


class ArticleDetailView(generics.RetrieveAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [AllowAny]


class UserDeleteView(generics.GenericAPIView):
    serializer_class = UserDeleteSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.delete()
        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class MorePostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        exclude_id = self.kwargs.get('post_id')
        feed_size = 20

        # 1. Get seed from query params, or generate a new one if it's the first visit
        seed_param = request.query_params.get('seed')
        if seed_param:
            seed = int(seed_param)
        else:
            # Use the current timestamp for a reasonably unique new seed
            seed = int(time.time())

        # 2. Seed the random number generator. This is the crucial step.
        random.seed(seed)

        # 3. Your existing logic for finding relevant posts
        try:
            current_post = Post.objects.get(id=exclude_id)
            tags = current_post.tags
            if tags and isinstance(tags, list):
                all_other_posts = Post.objects.exclude(id=exclude_id)
                relevant_posts = [post for post in all_other_posts if any(tag in post.tags for tag in tags)]

                if len(relevant_posts) > 0:
                    # This random sample is now DETERMINISTIC because of random.seed()
                    queryset = random.sample(relevant_posts, min(len(relevant_posts), feed_size))
                else:
                    # Fallback if no relevant posts are found
                    all_other_post_ids = list(Post.objects.exclude(id=exclude_id).values_list('id', flat=True))
                    sample_size = min(len(all_other_post_ids), feed_size)
                    random_ids = random.sample(all_other_post_ids, sample_size)
                    queryset = Post.objects.filter(id__in=random_ids)
            else:
                raise Post.DoesNotExist

        except Post.DoesNotExist:
            # Fallback if the post somehow has no tags or doesn't exist
            all_other_post_ids = list(Post.objects.exclude(id=exclude_id).values_list('id', flat=True))
            sample_size = min(len(all_other_post_ids), feed_size)
            random_ids = random.sample(all_other_post_ids, sample_size)
            queryset = Post.objects.filter(id__in=random_ids)

        serializer = self.get_serializer(queryset, many=True)

        # 4. Return the posts AND the seed that was used to generate them
        return Response({
            'seed': seed,
            'results': serializer.data
        })


class ForYouPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    # We now override the list method instead of get_queryset
    def list(self, request, *args, **kwargs):
        user = self.request.user
        feed_size = 40

        # Although the primary sorting isn't random, a seed is good for consistency
        seed = int(time.time())

        # Logic from your old get_queryset is moved here
        if not user.is_authenticated or not hasattr(user, 'interest_profile') or not user.interest_profile.tag_scores:
            # Fallback for users without a profile
            posts = list(Post.objects.all().order_by('-created_at')[:feed_size])
            random.shuffle(posts)  # Shuffle to provide variety

            serializer = self.get_serializer(posts, many=True)
            return Response({
                'seed': seed,
                'results': serializer.data
            })

        try:
            profile = user.interest_profile
            tag_scores = profile.tag_scores
            if not tag_scores:
                raise InterestProfile.DoesNotExist  # Treat empty scores as no profile

            all_posts = list(Post.objects.all())
            scored_posts = []
            for post in all_posts:
                relevance_score = 0
                if isinstance(post.tags, list):
                    for tag in post.tags:
                        relevance_score += tag_scores.get(tag, 0)
                if relevance_score > 0:
                    scored_posts.append({'post': post, 'score': relevance_score})

            scored_posts.sort(key=lambda x: x['score'], reverse=True)
            personalized_posts = [item['post'] for item in scored_posts]

            if len(personalized_posts) < feed_size:
                existing_ids = [p.id for p in personalized_posts]
                recent_posts = Post.objects.exclude(id__in=existing_ids).order_by('-created_at')
                # Chain combines the personalized list with the recent ones
                combined_posts = list(chain(personalized_posts, recent_posts))
                final_posts = combined_posts[:feed_size]
            else:
                final_posts = personalized_posts[:feed_size]

            serializer = self.get_serializer(final_posts, many=True)
            # Return the data in the correct format
            return Response({
                'seed': seed,
                'results': serializer.data
            })

        except InterestProfile.DoesNotExist:
            # Fallback for users with no interest profile yet
            posts = list(Post.objects.all().order_by('-created_at')[:feed_size])
            random.shuffle(posts)
            serializer = self.get_serializer(posts, many=True)
            return Response({
                'seed': seed,
                'results': serializer.data
            })


class TrackPostClickView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        if not post_id:
            return Response({'detail': 'Post ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            post = Post.objects.get(id=post_id)
            user = request.user
            profile, created = InterestProfile.objects.get_or_create(user=user)
            score_change = 0.1
            if post.tags and isinstance(post.tags, list):
                for tag in post.tags:
                    if tag:
                        current_score = profile.tag_scores.get(tag, 0)
                        profile.tag_scores[tag] = current_score + score_change
                profile.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class TrackSearchQueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get('query')
        if not query:
            return Response({'detail': 'Query is required.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        profile, created = InterestProfile.objects.get_or_create(user=user)
        score_change = 0.5
        search_terms = query.lower().split()
        for term in search_terms:
            if term in profile.tag_scores:
                profile.tag_scores[term] += score_change
            else:
                profile.tag_scores[term] = score_change
        profile.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TrackTryOnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        if not post_id:
            return Response({'detail': 'Post ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            post = Post.objects.get(id=post_id)
            user = request.user
            profile, created = InterestProfile.objects.get_or_create(user=user)

            # A "Try On" is a strong signal, so we give it a higher score change
            score_change = 1.5

            if post.tags and isinstance(post.tags, list):
                for tag in post.tags:
                    if tag:
                        current_score = profile.tag_scores.get(tag, 0)
                        profile.tag_scores[tag] = current_score + score_change
                profile.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)


class CollectionListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CollectionCreateSerializer
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
        # When updating (PUT or PATCH), use the simpler serializer
        if self.request.method in ['PUT', 'PATCH']:
            return CollectionCreateSerializer
        # Otherwise, use the default detailed serializer
        return CollectionDetailSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.name == "All Posts":
            return Response(
                {"detail": "The default 'All Posts' collection cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # If it's not the default collection, proceed with normal deletion
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
            # Also manage the post in the user's default "All Posts" collection
            default_collection, _ = request.user.collections.get_or_create(name="All Posts")
            if default_collection.id != collection.id and post not in default_collection.posts.all():
                default_collection.posts.add(post)

            return Response({'detail': message}, status=status.HTTP_200_OK)
        except Collection.DoesNotExist:
            return Response({'detail': 'Collection not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)

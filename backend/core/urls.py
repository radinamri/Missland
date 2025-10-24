from django.urls import path
from .views import (
    UserRegistrationView, GoogleLogin, UserProfileView, EmailChangeInitiateView,
    EmailChangeConfirmView, PostListView, ArticleListView, ArticleDetailView,
    PostDetailView, UserDeleteView, MorePostsView, ForYouPostListView,
    TrackPostClickView, TrackSearchQueryView, TrackTryOnView, CollectionListView,
    CollectionDetailView, ManagePostInCollectionView, SaveTryOnView, MyTryOnsListView,
    DeleteTryOnView, PasswordResetRequestView, PasswordResetConfirmView, FilteredPostListView
)
from dj_rest_auth.views import PasswordChangeView

urlpatterns = [
    # Auth
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('google/', GoogleLogin.as_view(), name='google_login'),

    # Profile & Account Management
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/delete/', UserDeleteView.as_view(), name='user-delete'),
    path('profile/my-try-ons/', MyTryOnsListView.as_view(), name='my-try-ons-list'),
    path('profile/my-try-ons/<int:try_on_id>/', DeleteTryOnView.as_view(), name='delete-try-on'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('email/change/initiate/', EmailChangeInitiateView.as_view(), name='email_change_initiate'),
    path('email/change/confirm/', EmailChangeConfirmView.as_view(), name='email_change_confirm'),

    # Posts & Feeds
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/filter/', FilteredPostListView.as_view(), name='post-filter'),
    path('posts/for-you/', ForYouPostListView.as_view(), name='for-you-post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_id>/more/', MorePostsView.as_view(), name='more-posts'),
    path('posts/<int:post_id>/save-try-on/', SaveTryOnView.as_view(), name='save-try-on'),

    # Articles
    path('articles/', ArticleListView.as_view(), name='article-list'),
    path('articles/<slug:slug>/', ArticleDetailView.as_view(), name='article-detail'),

    # Collections
    path('collections/', CollectionListView.as_view(), name='collection-list-create'),
    path('collections/<int:pk>/', CollectionDetailView.as_view(), name='collection-detail'),
    path('collections/<int:collection_id>/posts/<int:post_id>/', ManagePostInCollectionView.as_view(),
         name='manage-post-in-collection'),

    # Tracking
    path('track/click/', TrackPostClickView.as_view(), name='track-post-click'),
    path('track/search/', TrackSearchQueryView.as_view(), name='track-search-query'),
    path('track/try-on/', TrackTryOnView.as_view(), name='track-post-try-on'),

    # Add these two paths for password reset
    path('password/reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

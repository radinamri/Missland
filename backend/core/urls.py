from django.urls import path
from .views import UserRegistrationView, GoogleLogin, UserProfileView, EmailChangeInitiateView, EmailChangeConfirmView, \
    PostListView, ToggleSavePostView, SavedPostsListView, ArticleListView, ArticleDetailView, PostDetailView, \
    UserDeleteView, MorePostsView, ForYouPostListView
from dj_rest_auth.views import PasswordChangeView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('email/change/initiate/', EmailChangeInitiateView.as_view(), name='email_change_initiate'),
    path('email/change/confirm/', EmailChangeConfirmView.as_view(), name='email_change_confirm'),
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<int:post_id>/toggle-save/', ToggleSavePostView.as_view(), name='toggle-save-post'),
    path('profile/saved-posts/', SavedPostsListView.as_view(), name='saved-posts-list'),
    path('articles/', ArticleListView.as_view(), name='article-list'),
    path('articles/<slug:slug>/', ArticleDetailView.as_view(), name='article-detail'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('profile/delete/', UserDeleteView.as_view(), name='user-delete'),
    path('posts/<int:post_id>/more/', MorePostsView.as_view(), name='more-posts'),
    path('posts/for-you/', ForYouPostListView.as_view(), name='for-you-post-list'),
]

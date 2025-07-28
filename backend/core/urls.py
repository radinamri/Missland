from django.urls import path
from .views import UserRegistrationView, GoogleLogin, UserProfileView, EmailChangeInitiateView, EmailChangeConfirmView, \
    PostListView, ToggleSavePostView, SavedPostsListView, ArticleListView, ArticleDetailView
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
]

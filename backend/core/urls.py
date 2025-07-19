from django.urls import path
from .views import UserRegistrationView, GoogleLogin, UserProfileView
from dj_rest_auth.views import PasswordChangeView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
]

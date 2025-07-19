from django.urls import path
from .views import UserRegistrationView, GoogleLogin, UserProfileView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]

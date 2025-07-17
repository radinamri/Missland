from django.urls import path
from .views import UserRegistrationView, GoogleLogin

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('google/', GoogleLogin.as_view(), name='google_login'),  # <-- Add this line
]

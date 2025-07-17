from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User Model for NANA-AI.

    We use email as the primary identifier for authentication instead of username.
    A phone_number field is also added for OTP authentication.
    """
    # We don't need first_name and last_name, so we'll make them optional.
    first_name = None
    last_name = None

    # Email should be unique and is the main username field.
    email = models.EmailField(_('email address'), unique=True)

    # Phone number field for OTP. It's optional as users can sign up with email.
    phone_number = models.CharField(max_length=15, blank=True, null=True, unique=True)

    # This is what the user will log in with
    USERNAME_FIELD = 'email'

    # These fields are required when creating a user via createsuperuser
    REQUIRED_FIELDS = ['username']  # 'username' is still required for createsuperuser, but we will use email for login.

    def __str__(self):
        return self.email

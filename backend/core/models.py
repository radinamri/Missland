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


class Post(models.Model):
    """
    Represents a single nail or hair style post with searchable tags.
    """
    title = models.CharField(max_length=200)
    image_url = models.URLField(max_length=500)
    width = models.IntegerField()
    height = models.IntegerField()

    # This JSONField is perfect for storing a list of searchable tags
    tags = models.JSONField(default=list, blank=True, help_text="A list of tags like ['red', 'short', 'gel']")

    # For tracking users who save this post
    saved_by = models.ManyToManyField(User, related_name='saved_posts', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Article(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, help_text="A URL-friendly version of the title.")
    content = models.TextField()
    thumbnail_url = models.URLField(max_length=500)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    published_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-published_date']

    def __str__(self):
        return self.title

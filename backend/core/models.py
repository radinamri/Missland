from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


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

    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    # This is what the user will log in with
    USERNAME_FIELD = 'email'

    # These fields are required when creating a user via createsuperuser
    REQUIRED_FIELDS = ['username']  # 'username' is still required for createsuperuser, but we will use email for login.

    def __str__(self):
        return self.email


class Collection(models.Model):
    """
    Represents a user-defined collection of saved posts.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=100)
    posts = models.ManyToManyField('Post', blank=True, related_name='collections')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a user cannot have two collections with the same name
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} by {self.user.email}"


class Post(models.Model):
    """
    Represents a single nail or hair style post.
    """
    title = models.CharField(max_length=200)
    image_url = models.URLField(max_length=500)
    width = models.IntegerField()
    height = models.IntegerField()
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    try_on_image_url = models.URLField(max_length=500, blank=True)

    # REMOVED: The old saved_by field is no longer needed
    # saved_by = models.ManyToManyField(User, related_name='saved_posts', blank=True)

    def __str__(self):
        return self.title


class TryOn(models.Model):
    """
    Represents a user's saved virtual try-on.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='try_ons')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='tried_by_users')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} tried on {self.post.title}"


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


class InterestProfile(models.Model):
    """
    Stores a user's calculated interests based on their activity.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interest_profile')

    # This will store scores for each tag, e.g., {"red": 5, "almond": 3, "blue": 1}
    tag_scores = models.JSONField(default=dict)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Interest Profile"

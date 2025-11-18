from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import uuid
import hashlib


class User(AbstractUser):
    """
    Custom User Model for Missland.

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


class UserSession(models.Model):
    """
    Tracks user authentication sessions across devices.
    Allows users to be logged in from multiple devices simultaneously.
    Each session represents one device/login instance.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    
    # Unique session identifier
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    
    # Device information
    device_name = models.CharField(max_length=255, help_text="Device name (e.g., 'iPhone 14', 'Chrome on MacBook')")
    device_type = models.CharField(
        max_length=20, 
        choices=[
            ('mobile', 'Mobile'),
            ('tablet', 'Tablet'),
            ('desktop', 'Desktop'),
            ('unknown', 'Unknown'),
        ],
        default='unknown'
    )
    os_name = models.CharField(max_length=100, blank=True, help_text="Operating system (e.g., 'iOS 17', 'Windows 11')")
    browser_name = models.CharField(max_length=100, blank=True, help_text="Browser (e.g., 'Chrome', 'Safari')")
    
    # Location/Network info (optional)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent_hash = models.CharField(max_length=64, blank=True, db_index=True, help_text="Hash of User-Agent for additional security")
    
    # Session lifecycle
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, db_index=True, help_text="Whether this session is still valid")
    
    class Meta:
        ordering = ['-last_activity_at']
        indexes = [
            models.Index(fields=['user', 'is_active'], name='usersession_user_active_idx'),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_name} ({self.session_id})"

    @classmethod
    def create_session(cls, user, device_info, ip_address=None):
        """
        Helper method to create a new session for a user.
        
        Args:
            user: User instance
            device_info: Dict with keys: device_name, device_type, os_name, browser_name, user_agent
            ip_address: User's IP address
            
        Returns:
            UserSession instance
        """
        user_agent = device_info.get('user_agent', '')
        user_agent_hash = hashlib.sha256(user_agent.encode()).hexdigest() if user_agent else ''
        
        session = cls(
            user=user,
            device_name=device_info.get('device_name', 'Unknown Device'),
            device_type=device_info.get('device_type', 'unknown'),
            os_name=device_info.get('os_name', ''),
            browser_name=device_info.get('browser_name', ''),
            ip_address=ip_address,
            user_agent_hash=user_agent_hash,
        )
        session.save()
        return session


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
    Represents a single nail or hair-style post with structured annotations.
    """
    title = models.CharField(max_length=200, db_index=True)
    image_url = models.URLField(max_length=500)
    width = models.IntegerField()
    height = models.IntegerField()

    # --- NEW FIELDS BASED ON YOUR ANNOTATIONS ---
    # Storing as CharFields. Use db_index=True for faster lookups.
    shape = models.CharField(max_length=50, blank=True, db_index=True)
    pattern = models.CharField(max_length=50, blank=True, db_index=True)
    size = models.CharField(max_length=50, blank=True, db_index=True)

    # Storing the list of colors in a JSONField is efficient for querying.
    colors = models.JSONField(default=list, blank=True)

    # Performance tracking fields
    views_count = models.IntegerField(default=0, db_index=True)
    saves_count = models.IntegerField(default=0, db_index=True)

    # REMOVED: The old tags field is no longer needed
    # tags = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    try_on_image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['shape', 'pattern'], name='post_shape_pattern_idx'),
            models.Index(fields=['shape', 'size'], name='post_shape_size_idx'),
            models.Index(fields=['-created_at'], name='post_created_desc_idx'),
            models.Index(fields=['-views_count'], name='post_views_desc_idx'),
            models.Index(fields=['-saves_count'], name='post_saves_desc_idx'),
        ]
        ordering = ['-created_at']

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

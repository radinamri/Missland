"""
Try-On Models

Database models for managing try-on sessions and results.
"""

from django.db import models
from django.contrib.auth import get_user_model
from core.models import Post
import uuid
from django.utils import timezone

User = get_user_model()


class TryOnSession(models.Model):
    """
    Represents a live try-on session.
    
    A session is created when a user starts a try-on experience,
    either from explore page (with selected nail post) or from
    upload mode (with uploaded nail reference).
    """
    
    STATUS_CHOICES = [
        ('initializing', 'Initializing'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]
    
    session_id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4,
        editable=False
    )
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='tryon_sessions',
        help_text='User who created this session'
    )
    
    nail_reference_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tryon_sessions',
        help_text='Nail post selected from explore page'
    )
    
    nail_reference_image = models.ImageField(
        upload_to='try_on/references/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Uploaded nail reference image (alternative to post)'
    )
    
    source_image = models.ImageField(
        upload_to='try_on/sources/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Uploaded hand image (optional, alternative to camera)'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='initializing',
        db_index=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    expires_at = models.DateTimeField(
        help_text='Session expiration time (typically 30 minutes)'
    )
    
    # Statistics stored as JSON
    stats = models.JSONField(
        default=dict,
        blank=True,
        help_text='Session statistics: frames processed, FPS, latency, etc.'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['expires_at']),
        ]
        verbose_name = 'Try-On Session'
        verbose_name_plural = 'Try-On Sessions'
    
    def __str__(self):
        return f"Session {self.session_id} - {self.status}"
    
    def is_expired(self):
        """Check if session has expired."""
        return timezone.now() > self.expires_at
    
    def get_nail_reference_url(self):
        """Get the nail reference image URL."""
        if self.nail_reference_post:
            return self.nail_reference_post.image_url
        elif self.nail_reference_image:
            return self.nail_reference_image.url
        return None


class TryOnResult(models.Model):
    """
    Represents a captured/saved try-on result.
    
    When a user captures a frame during a try-on session,
    it's saved as a TryOnResult that can be viewed in their profile.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tryon_results',
        help_text='User who captured this result'
    )
    
    session = models.ForeignKey(
        TryOnSession,
        on_delete=models.CASCADE,
        related_name='results',
        help_text='Session this result was captured from'
    )
    
    nail_reference_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='Original nail post reference'
    )
    
    processed_image = models.ImageField(
        upload_to='try_on/results/%Y/%m/%d/',
        help_text='Final try-on result image with overlay'
    )
    
    thumbnail = models.ImageField(
        upload_to='try_on/thumbnails/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Thumbnail for grid display'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # AI model metadata
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text='AI model confidence score (0.0-1.0)'
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Detection info: hands detected, fingertips, etc.'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
        verbose_name = 'Try-On Result'
        verbose_name_plural = 'Try-On Results'
    
    def __str__(self):
        return f"Result {self.id} - User {self.user_id}"

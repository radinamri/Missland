"""
Try-On Serializers

DRF serializers for REST API endpoints.
"""

from rest_framework import serializers
from .models import TryOnSession, TryOnResult
from core.models import Post


class TryOnSessionSerializer(serializers.ModelSerializer):
    """Serializer for TryOnSession model."""
    
    nail_reference_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = TryOnSession
        fields = [
            'session_id',
            'user',
            'nail_reference_post',
            'nail_reference_image',
            'nail_reference_url',
            'source_image',
            'status',
            'created_at',
            'updated_at',
            'expires_at',
            'is_expired',
            'stats',
        ]
        read_only_fields = ['session_id', 'created_at', 'updated_at', 'stats']
    
    def get_nail_reference_url(self, obj):
        """Get nail reference image URL."""
        return obj.get_nail_reference_url()
    
    def get_is_expired(self, obj):
        """Check if session is expired."""
        return obj.is_expired()


class TryOnSessionCreateSerializer(serializers.Serializer):
    """Serializer for creating a new try-on session."""
    
    mode = serializers.ChoiceField(
        choices=['explore', 'upload'],
        required=True,
        help_text='Session mode: explore (with postId) or upload (with images)'
    )
    
    # For explore mode
    post_id = serializers.IntegerField(
        required=False,
        help_text='Post ID from explore page (required for explore mode)'
    )
    
    # For upload mode
    nail_reference_image = serializers.ImageField(
        required=False,
        help_text='Uploaded nail reference image (required for upload mode)'
    )
    
    source_image = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text='Uploaded hand image (optional for upload mode)'
    )
    
    def validate(self, data):
        """Validate that required fields are present based on mode."""
        mode = data.get('mode')
        
        if mode == 'explore':
            if not data.get('post_id'):
                raise serializers.ValidationError({
                    'post_id': 'post_id is required for explore mode'
                })
        
        elif mode == 'upload':
            if not data.get('nail_reference_image'):
                raise serializers.ValidationError({
                    'nail_reference_image': 'nail_reference_image is required for upload mode'
                })
        
        return data
    
    def validate_post_id(self, value):
        """Validate that the post exists."""
        try:
            Post.objects.get(id=value)
        except Post.DoesNotExist:
            raise serializers.ValidationError('Post not found')
        return value


class TryOnResultSerializer(serializers.ModelSerializer):
    """Serializer for TryOnResult model."""
    
    nail_reference_url = serializers.SerializerMethodField()
    processed_image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TryOnResult
        fields = [
            'id',
            'user',
            'session',
            'nail_reference_post',
            'nail_reference_url',
            'processed_image',
            'processed_image_url',
            'thumbnail',
            'thumbnail_url',
            'created_at',
            'confidence_score',
            'metadata',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_nail_reference_url(self, obj):
        """Get nail reference image URL."""
        if obj.nail_reference_post:
            return obj.nail_reference_post.image_url
        return None
    
    def get_processed_image_url(self, obj):
        """Get processed image URL."""
        if obj.processed_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.processed_image.url)
            return obj.processed_image.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL."""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None


class TryOnCaptureSerializer(serializers.Serializer):
    """Serializer for capturing a try-on result."""
    
    session_id = serializers.UUIDField(
        required=True,
        help_text='Session ID to capture from'
    )
    
    processed_image = serializers.ImageField(
        required=True,
        help_text='Processed image with nail overlay'
    )
    
    confidence_score = serializers.FloatField(
        required=False,
        min_value=0.0,
        max_value=1.0,
        help_text='AI model confidence score'
    )
    
    metadata = serializers.JSONField(
        required=False,
        help_text='Detection metadata'
    )
    
    def validate_session_id(self, value):
        """Validate that the session exists and belongs to user."""
        try:
            session = TryOnSession.objects.get(session_id=value)
            
            # Check ownership if user is authenticated
            user = self.context.get('request').user
            if user and user.is_authenticated:
                if session.user and session.user != user:
                    raise serializers.ValidationError('Session does not belong to you')
            
            return value
        except TryOnSession.DoesNotExist:
            raise serializers.ValidationError('Session not found')

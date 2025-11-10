"""
Try-On Views

REST API endpoints for try-on feature.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

from .models import TryOnSession, TryOnResult
from .serializers import (
    TryOnSessionSerializer,
    TryOnSessionCreateSerializer,
    TryOnResultSerializer,
    TryOnCaptureSerializer
)
from core.models import Post

import logging

logger = logging.getLogger(__name__)


class TryOnSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing try-on sessions.
    
    Endpoints:
    - POST /api/try-on/sessions/ - Create new session
    - GET /api/try-on/sessions/{id}/ - Get session details
    - GET /api/try-on/sessions/ - List user's sessions
    - DELETE /api/try-on/sessions/{id}/ - Delete session
    """
    
    serializer_class = TryOnSessionSerializer
    permission_classes = [AllowAny]  # Can be IsAuthenticated if required
    
    def get_queryset(self):
        """Get sessions for current user or all if staff."""
        user = self.request.user
        
        if user.is_authenticated:
            if user.is_staff:
                return TryOnSession.objects.all()
            return TryOnSession.objects.filter(user=user)
        
        # For anonymous users, allow access by session_id
        return TryOnSession.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new try-on session.
        
        Request body:
        - mode: 'explore' or 'upload'
        - post_id: (required for explore mode)
        - nail_reference_image: (required for upload mode)
        - source_image: (optional for upload mode)
        """
        serializer = TryOnSessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        mode = data['mode']
        
        # Set expiration time (30 minutes from now)
        expires_at = timezone.now() + timedelta(minutes=30)
        
        # Create session based on mode
        session_data = {
            'expires_at': expires_at,
            'status': 'initializing'
        }
        
        # Set user if authenticated
        if request.user.is_authenticated:
            session_data['user'] = request.user
        
        if mode == 'explore':
            # Get nail reference from post
            post = get_object_or_404(Post, id=data['post_id'])
            session_data['nail_reference_post'] = post
        
        elif mode == 'upload':
            # Use uploaded nail reference
            session_data['nail_reference_image'] = data['nail_reference_image']
            
            # Optional source image
            if data.get('source_image'):
                session_data['source_image'] = data['source_image']
        
        # Create session
        session = TryOnSession.objects.create(**session_data)
        
        # Serialize and return
        response_serializer = TryOnSessionSerializer(session)
        
        logger.info(f"Created try-on session {session.session_id} in {mode} mode")
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """
        Extend session expiration time.
        
        POST /api/try-on/sessions/{id}/extend/
        """
        session = self.get_object()
        
        # Extend by 15 minutes
        session.expires_at = timezone.now() + timedelta(minutes=15)
        session.save(update_fields=['expires_at', 'updated_at'])
        
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class TryOnResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing try-on results (captured frames).
    
    Endpoints:
    - POST /api/try-on/results/ - Capture a result
    - GET /api/try-on/results/{id}/ - Get result details
    - GET /api/try-on/results/ - List user's results
    - DELETE /api/try-on/results/{id}/ - Delete result
    """
    
    serializer_class = TryOnResultSerializer
    permission_classes = [AllowAny]  # Can be IsAuthenticated if required
    
    def get_queryset(self):
        """Get results for current user."""
        user = self.request.user
        
        if user.is_authenticated:
            if user.is_staff:
                return TryOnResult.objects.all()
            return TryOnResult.objects.filter(user=user)
        
        return TryOnResult.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Capture and save a try-on result.
        
        Request body:
        - session_id: Session UUID
        - processed_image: Image file with nail overlay
        - confidence_score: (optional)
        - metadata: (optional)
        """
        serializer = TryOnCaptureSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Get session
        session = get_object_or_404(
            TryOnSession,
            session_id=data['session_id']
        )
        
        # Create result
        result_data = {
            'session': session,
            'processed_image': data['processed_image'],
        }
        
        # Set user
        if request.user.is_authenticated:
            result_data['user'] = request.user
        elif session.user:
            result_data['user'] = session.user
        else:
            return Response(
                {'error': 'User not authenticated'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Set nail reference post if exists
        if session.nail_reference_post:
            result_data['nail_reference_post'] = session.nail_reference_post
        
        # Optional fields
        if 'confidence_score' in data:
            result_data['confidence_score'] = data['confidence_score']
        
        if 'metadata' in data:
            result_data['metadata'] = data['metadata']
        
        # Create result
        result = TryOnResult.objects.create(**result_data)
        
        # Generate thumbnail
        try:
            self._generate_thumbnail(result)
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
        
        # Serialize and return
        response_serializer = TryOnResultSerializer(
            result,
            context={'request': request}
        )
        
        logger.info(f"Captured try-on result {result.id} for session {session.session_id}")
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def _generate_thumbnail(self, result: TryOnResult, size=(300, 300)):
        """Generate thumbnail for result image."""
        if not result.processed_image:
            return
        
        try:
            # Open image
            image = Image.open(result.processed_image)
            
            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save to BytesIO
            thumb_io = BytesIO()
            image.save(thumb_io, format='JPEG', quality=85)
            thumb_io.seek(0)
            
            # Create InMemoryUploadedFile
            thumb_file = InMemoryUploadedFile(
                thumb_io,
                None,
                f'thumb_{result.id}.jpg',
                'image/jpeg',
                thumb_io.tell(),
                None
            )
            
            # Save thumbnail
            result.thumbnail = thumb_file
            result.save(update_fields=['thumbnail'])
            
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
            raise

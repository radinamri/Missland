# Backend Structure for Try-On Feature

## Overview
This document outlines the Django backend structure needed to support the real-time try-on feature with WebSocket communication.

---

## Required Dependencies

Add to `backend/requirements.txt`:
```txt
# Existing dependencies...

# WebSocket support
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0

# Image processing
Pillow==10.1.0

# Redis client
redis==5.0.0

# Async HTTP client (for AI service communication)
aiohttp==3.9.0
```

---

## Django Settings Configuration

### `backend/config/settings.py`

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing apps
    'daphne',  # Must be first
    'channels',
    'try_on',  # New app
]

# ASGI Application
ASGI_APPLICATION = 'config.asgi.application'

# Channel Layers Configuration
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],  # Use 'localhost' for local development
        },
    },
}

# Try-On Service Configuration
TRYON_AI_SERVICE_URL = os.getenv('TRYON_AI_SERVICE_URL', 'ws://localhost:8002/ws/tryon')
TRYON_SESSION_TIMEOUT = 1800  # 30 minutes
TRYON_MAX_FRAME_SIZE = 10 * 1024 * 1024  # 10MB
```

---

## ASGI Configuration

### `backend/config/asgi.py`

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# Import routing after Django setup
from try_on import routing as try_on_routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                try_on_routing.websocket_urlpatterns
            )
        )
    ),
})
```

---

## Django App Structure

### Create the app
```bash
cd backend
python manage.py startapp try_on
```

### Directory Structure
```
backend/try_on/
├── __init__.py
├── apps.py
├── models.py              # TryOnSession, TryOnResult models
├── serializers.py         # DRF serializers
├── views.py               # REST API endpoints
├── urls.py                # REST API URL patterns
├── consumers.py           # WebSocket consumer
├── routing.py             # WebSocket URL patterns
├── admin.py               # Django admin configuration
├── services/
│   ├── __init__.py
│   ├── session_manager.py    # Session lifecycle management
│   ├── ai_client.py           # AI service communication
│   └── image_storage.py       # Image upload/storage handling
└── migrations/
    └── __init__.py
```

---

## Models

### `backend/try_on/models.py`

```python
from django.db import models
from django.contrib.auth import get_user_model
from core.models import Post
import uuid

User = get_user_model()


class TryOnSession(models.Model):
    """Represents a live try-on session."""
    
    STATUS_CHOICES = [
        ('initializing', 'Initializing'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('error', 'Error'),
    ]
    
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='tryon_sessions'
    )
    nail_reference_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tryon_sessions'
    )
    nail_reference_image = models.ImageField(
        upload_to='try_on/references/',
        null=True,
        blank=True
    )
    source_image = models.ImageField(
        upload_to='try_on/sources/',
        null=True,
        blank=True,
        help_text='Uploaded hand image (optional, alternative to camera)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='initializing'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    # Statistics (stored as JSON)
    stats = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"TryOnSession {self.session_id} - {self.status}"


class TryOnResult(models.Model):
    """Represents a captured/saved try-on result."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tryon_results'
    )
    session = models.ForeignKey(
        TryOnSession,
        on_delete=models.CASCADE,
        related_name='results'
    )
    nail_reference_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    processed_image = models.ImageField(
        upload_to='try_on/results/',
        help_text='Final try-on result image'
    )
    thumbnail = models.ImageField(
        upload_to='try_on/thumbnails/',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Metadata
    confidence_score = models.FloatField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"TryOnResult {self.id} - User {self.user_id}"
```

---

## WebSocket Consumer

### `backend/try_on/consumers.py`

```python
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from datetime import timedelta
from .models import TryOnSession
from .services.ai_client import AITryOnClient
from django.conf import settings

logger = logging.getLogger(__name__)


class TryOnConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time try-on streaming.
    
    Handles:
    - Client camera frames
    - Communication with AI service
    - Processed frame delivery
    - Session management
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.ai_client = None
        self.frame_count = 0
    
    async def connect(self):
        """Accept WebSocket connection and validate session."""
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        
        # Validate session exists
        session = await self.get_session()
        if not session:
            logger.warning(f"Session {self.session_id} not found")
            await self.close(code=4004)
            return
        
        # Accept connection
        await self.accept()
        logger.info(f"WebSocket connected: session {self.session_id}")
        
        # Initialize AI client
        self.ai_client = AITryOnClient(settings.TRYON_AI_SERVICE_URL)
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        logger.info(f"WebSocket disconnected: session {self.session_id}, code {close_code}")
        
        # Close AI service connection
        if self.ai_client and self.session_id:
            await self.ai_client.close_session(self.session_id)
        
        # Update session status
        await self.update_session_status('completed')
    
    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming messages from client."""
        try:
            if text_data:
                # JSON message
                data = json.loads(text_data)
                await self.handle_json_message(data)
            
            elif bytes_data:
                # Binary frame
                await self.handle_binary_frame(bytes_data)
        
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            await self.send_error("PROCESSING_FAILED", str(e))
    
    async def handle_json_message(self, data):
        """Handle JSON text messages."""
        message_type = data.get('type')
        
        if message_type == 'init_session':
            await self.initialize_session(data)
        
        elif message_type == 'control':
            await self.handle_control(data)
        
        elif message_type == 'capture':
            await self.handle_capture(data)
        
        elif message_type == 'ping':
            # Respond to heartbeat
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': data.get('timestamp')
            }))
        
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    async def initialize_session(self, data):
        """Initialize session with AI service."""
        try:
            session = await self.get_session()
            
            # Get nail reference URL
            if session.nail_reference_post:
                nail_reference_url = session.nail_reference_post.image_url
            elif session.nail_reference_image:
                nail_reference_url = session.nail_reference_image.url
            else:
                await self.send_error("INVALID_SESSION", "No nail reference found")
                return
            
            # Initialize with AI service
            success = await self.ai_client.initialize_session(
                str(self.session_id),
                {
                    'url': nail_reference_url,
                    'post_id': session.nail_reference_post_id,
                    'metadata': {}
                }
            )
            
            if success:
                await self.update_session_status('active')
                await self.send(text_data=json.dumps({
                    'type': 'session_ready',
                    'session_id': str(self.session_id),
                    'nail_reference_url': nail_reference_url,
                    'mode': 'explore' if session.nail_reference_post else 'upload',
                    'config': {
                        'target_fps': 25,
                        'max_resolution': '720p',
                        'supported_formats': ['webp', 'jpeg']
                    },
                    'timestamp': int(timezone.now().timestamp() * 1000)
                }))
            else:
                await self.send_error("AI_SERVICE_UNAVAILABLE", "Failed to initialize AI service")
        
        except Exception as e:
            logger.error(f"Session initialization failed: {e}", exc_info=True)
            await self.send_error("INIT_FAILED", str(e))
    
    async def handle_binary_frame(self, bytes_data):
        """Process binary frame from camera."""
        try:
            # Parse metadata header (first 1024 bytes)
            metadata_bytes = bytes_data[:1024]
            metadata_str = metadata_bytes.decode('utf-8').rstrip('\x00')
            metadata = json.loads(metadata_str)
            
            # Extract frame data
            frame_data = bytes_data[1024:]
            
            sequence = metadata['sequence']
            self.frame_count += 1
            
            # Forward to AI service
            result = await self.ai_client.process_frame(
                str(self.session_id),
                frame_data,
                sequence
            )
            
            if result:
                if result.get('error'):
                    # Send error but don't close connection
                    await self.send(text_data=json.dumps(result['metadata']))
                else:
                    # Send processed frame back to client
                    # First send metadata as JSON
                    await self.send(text_data=json.dumps(result['metadata']))
                    
                    # Then send binary frame
                    await self.send(bytes_data=result['frame_data'])
        
        except Exception as e:
            logger.error(f"Frame processing failed: {e}", exc_info=True)
            await self.send_error("FRAME_PROCESSING_FAILED", str(e))
    
    async def handle_control(self, data):
        """Handle control commands (pause, resume, etc.)."""
        action = data.get('action')
        
        if action == 'pause':
            await self.update_session_status('paused')
        
        elif action == 'resume':
            await self.update_session_status('active')
        
        logger.info(f"Control action: {action}")
    
    async def handle_capture(self, data):
        """Save current frame to user's collection."""
        # This would be implemented to save the current processed frame
        # as a TryOnResult
        logger.info(f"Capture requested for session {self.session_id}")
        
        # TODO: Implement capture logic
        # 1. Get latest processed frame
        # 2. Create TryOnResult record
        # 3. Generate thumbnail
        # 4. Send confirmation
        
        await self.send(text_data=json.dumps({
            'type': 'frame_saved',
            'try_on_id': 0,  # Placeholder
            'timestamp': int(timezone.now().timestamp() * 1000)
        }))
    
    async def send_error(self, code, message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'code': code,
            'message': message,
            'recoverable': code not in ['AI_SERVICE_UNAVAILABLE', 'SESSION_EXPIRED'],
            'timestamp': int(timezone.now().timestamp() * 1000)
        }))
    
    @database_sync_to_async
    def get_session(self):
        """Fetch session from database."""
        try:
            return TryOnSession.objects.get(session_id=self.session_id)
        except TryOnSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def update_session_status(self, status):
        """Update session status."""
        TryOnSession.objects.filter(session_id=self.session_id).update(
            status=status,
            updated_at=timezone.now()
        )
```

---

## WebSocket Routing

### `backend/try_on/routing.py`

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/try-on/(?P<session_id>[0-9a-f-]+)/$', consumers.TryOnConsumer.as_asgi()),
]
```

---

## REST API Views

### `backend/try_on/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import TryOnSession, TryOnResult
from .serializers import TryOnSessionSerializer, TryOnResultSerializer
from django.conf import settings
import uuid


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """Create a new try-on session."""
    nail_post_id = request.data.get('nail_post_id')
    user_id = request.data.get('user_id')
    
    session = TryOnSession.objects.create(
        user_id=user_id or request.user.id,
        nail_reference_post_id=nail_post_id,
        status='initializing',
        expires_at=timezone.now() + timedelta(seconds=settings.TRYON_SESSION_TIMEOUT)
    )
    
    return Response({
        'session_id': str(session.session_id),
        'expires_at': session.expires_at.isoformat()
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_image(request):
    """Upload nail reference or source image."""
    file = request.FILES.get('file')
    image_type = request.data.get('type')  # 'nail_reference' or 'source_image'
    
    if not file or not image_type:
        return Response(
            {'error': 'Missing file or type'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Save to media storage
    # In production, use cloud storage (S3, etc.)
    from django.core.files.storage import default_storage
    
    filename = f"try_on/{image_type}/{uuid.uuid4()}.webp"
    path = default_storage.save(filename, file)
    url = default_storage.url(path)
    
    return Response({
        'url': url,
        'type': image_type
    }, status=status.HTTP_201_CREATED)


class TryOnResultViewSet(viewsets.ReadOnlyModelViewSet):
    """View saved try-on results."""
    serializer_class = TryOnResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TryOnResult.objects.filter(user=self.request.user)
```

---

## REST API URLs

### `backend/try_on/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'results', views.TryOnResultViewSet, basename='tryon-result')

urlpatterns = [
    path('session/create/', views.create_session, name='tryon-create-session'),
    path('upload/', views.upload_image, name='tryon-upload'),
    path('', include(router.urls)),
]
```

### Add to `backend/config/urls.py`:

```python
urlpatterns = [
    # ... existing patterns
    path('api/try-on/', include('try_on.urls')),
]
```

---

## AI Service Client

### `backend/try_on/services/ai_client.py`

```python
"""
AI Service Client for Try-On WebSocket communication.

See AI_MICROSERVICE_INTEGRATION.md for full implementation.
"""

import asyncio
import websockets
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class AITryOnClient:
    """
    Client to communicate with AI microservice via WebSocket.
    """
    
    def __init__(self, ai_service_url: str):
        self.ai_service_url = ai_service_url
        self.connections: Dict[str, websockets.WebSocketClientProtocol] = {}
    
    async def initialize_session(
        self, 
        session_id: str, 
        nail_reference: Dict[str, Any]
    ) -> bool:
        """Initialize a try-on session with the AI service."""
        # See AI_MICROSERVICE_INTEGRATION.md for implementation
        pass
    
    async def process_frame(
        self, 
        session_id: str, 
        frame_data: bytes,
        sequence: int
    ) -> Optional[Dict[str, Any]]:
        """Send a frame to AI service for processing."""
        # See AI_MICROSERVICE_INTEGRATION.md for implementation
        pass
    
    async def close_session(self, session_id: str):
        """Close a try-on session."""
        # See AI_MICROSERVICE_INTEGRATION.md for implementation
        pass
```

---

## Admin Configuration

### `backend/try_on/admin.py`

```python
from django.contrib import admin
from .models import TryOnSession, TryOnResult


@admin.register(TryOnSession)
class TryOnSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'created_at']
    search_fields = ['session_id', 'user__username']
    readonly_fields = ['session_id', 'created_at', 'updated_at']


@admin.register(TryOnResult)
class TryOnResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'nail_reference_post', 'confidence_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at']
```

---

## Docker Configuration

### Update `docker-compose.yml`:

```yaml
services:
  # ... existing services
  
  daphne:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8001 config.asgi:application
    volumes:
      - ./backend:/app
    ports:
      - "8001:8001"
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings
      - TRYON_AI_SERVICE_URL=ws://ai-tryon:8002/ws/tryon
    depends_on:
      - redis
      - db
    networks:
      - backend
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - backend
  
  ai-tryon:
    build: ./ai_service
    ports:
      - "8002:8002"
    environment:
      - MODEL_PATH=/models/nail_tryon.pth
    volumes:
      - ./models:/models
    networks:
      - backend
```

---

## Migrations

```bash
# Create and apply migrations
python manage.py makemigrations try_on
python manage.py migrate try_on
```

---

## Testing

### Create `backend/try_on/tests.py`:

```python
from django.test import TestCase
from channels.testing import WebsocketCommunicator
from .consumers import TryOnConsumer
from .models import TryOnSession
from django.contrib.auth import get_user_model

User = get_user_model()


class TryOnConsumerTest(TestCase):
    """Test WebSocket consumer."""
    
    async def test_connect(self):
        """Test WebSocket connection."""
        user = await User.objects.acreate(username='test')
        session = await TryOnSession.objects.acreate(
            user=user,
            status='initializing'
        )
        
        communicator = WebsocketCommunicator(
            TryOnConsumer.as_asgi(),
            f"/ws/try-on/{session.session_id}/"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        await communicator.disconnect()
```

---

## Next Steps

1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations: `python manage.py migrate`
3. Start Daphne server: `daphne -b 0.0.0.0 -p 8001 config.asgi:application`
4. Test WebSocket connection with frontend
5. Implement AI service client methods
6. Add error handling and logging
7. Implement capture/save functionality
8. Add performance monitoring

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2025  
**Status**: Implementation Ready

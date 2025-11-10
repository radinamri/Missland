"""
Try-On WebSocket Consumer

Handles real-time WebSocket connections for nail try-on feature.
Bridges frontend camera stream and AI microservice.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from datetime import timedelta
from .models import TryOnSession
from .ai_client import AITryOnClient

logger = logging.getLogger(__name__)


class TryOnConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time try-on streaming.
    
    Flow:
    1. Client connects with session_id
    2. Consumer retrieves session from DB
    3. Consumer connects to AI microservice
    4. Consumer forwards frames: Client → AI → Client
    5. Consumer tracks statistics and handles errors
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.session = None
        self.ai_client: AITryOnClient = None
        self.frames_sent = 0
        self.frames_received = 0
        self.connection_start_time = None
        
    async def connect(self):
        """Handle WebSocket connection from frontend."""
        # Extract session_id from URL route
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        
        # Get user from scope (if authenticated)
        user = self.scope.get('user')
        
        logger.info(f"Try-on connection request for session {self.session_id}")
        
        # Retrieve and validate session
        self.session = await self.get_session(self.session_id)
        
        if not self.session:
            logger.warning(f"Session {self.session_id} not found")
            await self.close(code=4004)
            return
        
        if self.session.is_expired():
            logger.warning(f"Session {self.session_id} has expired")
            await self.close(code=4001)
            return
        
        # Accept WebSocket connection
        await self.accept()
        
        self.connection_start_time = timezone.now()
        
        # Update session status
        await self.update_session_status('active')
        
        # Get nail reference URL
        nail_reference_url = self.session.get_nail_reference_url()
        
        if not nail_reference_url:
            logger.error(f"No nail reference for session {self.session_id}")
            await self.send_error('no_reference', 'No nail reference image found')
            await self.close(code=4002)
            return
        
        # Connect to AI microservice
        self.ai_client = AITryOnClient(self.session_id)
        ai_connected = await self.ai_client.connect(nail_reference_url)
        
        if not ai_connected:
            logger.error(f"Failed to connect to AI service for session {self.session_id}")
            await self.send_error('ai_connection_failed', 'Could not connect to AI service')
            await self.close(code=4003)
            return
        
        # Send ready message to client
        await self.send(text_data=json.dumps({
            'type': 'ready',
            'session_id': self.session_id,
            'message': 'Connected to AI service, ready for frames'
        }))
        
        logger.info(f"Try-on session {self.session_id} fully initialized")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        logger.info(f"Try-on session {self.session_id} disconnecting (code: {close_code})")
        
        # Disconnect from AI service
        if self.ai_client:
            await self.ai_client.disconnect()
        
        # Update session status and stats
        if self.session:
            duration = (timezone.now() - self.connection_start_time).total_seconds() if self.connection_start_time else 0
            
            stats = {
                'total_frames_sent': self.frames_sent,
                'total_frames_received': self.frames_received,
                'duration_seconds': duration,
                'avg_fps': self.frames_sent / duration if duration > 0 else 0
            }
            
            await self.update_session_stats(stats)
            await self.update_session_status('completed')
    
    async def receive(self, text_data=None, bytes_data=None):
        """
        Handle incoming messages from frontend.
        
        Messages can be:
        - Binary: Camera frame data
        - JSON: Control commands (pause, resume, etc.)
        """
        
        if bytes_data:
            # Binary frame data
            await self.handle_frame(bytes_data)
        
        elif text_data:
            # JSON control message
            try:
                data = json.loads(text_data)
                await self.handle_control_message(data)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received: {text_data}")
                await self.send_error('invalid_json', 'Invalid message format')
    
    async def handle_frame(self, frame_data: bytes):
        """
        Handle incoming camera frame.
        
        Args:
            frame_data: Binary message with header + image data
        """
        try:
            # Parse header (first 1024 bytes)
            header_data = frame_data[:1024].rstrip(b'\x00')
            header = json.loads(header_data.decode('utf-8'))
            
            frame_number = header.get('frame_number', 0)
            image_data = frame_data[1024:]
            
            # Forward to AI service
            if self.ai_client and self.ai_client.connected:
                await self.ai_client.send_frame(image_data, frame_number)
                self.frames_sent += 1
                
                # Receive processed result
                result = await self.ai_client.receive_result()
                
                if result and 'image' in result:
                    # Forward processed frame back to client
                    result_header = result['header']
                    result_image = result['image']
                    
                    # Reconstruct binary message
                    result_header_json = json.dumps(result_header).encode('utf-8')
                    result_header_padded = result_header_json.ljust(1024, b'\x00')
                    
                    await self.send(bytes_data=result_header_padded + result_image)
                    self.frames_received += 1
                    
                elif result and result.get('type') == 'error':
                    # AI service reported error
                    await self.send_error('ai_processing_error', result.get('message', 'Unknown error'))
            
        except Exception as e:
            logger.error(f"Error handling frame: {str(e)}")
            await self.send_error('frame_processing_error', str(e))
    
    async def handle_control_message(self, data: dict):
        """
        Handle control messages from frontend.
        
        Supported commands:
        - pause: Pause processing
        - resume: Resume processing
        - capture: Save current result
        """
        msg_type = data.get('type')
        
        if msg_type == 'pause':
            await self.update_session_status('paused')
            await self.send(text_data=json.dumps({
                'type': 'paused',
                'message': 'Session paused'
            }))
        
        elif msg_type == 'resume':
            await self.update_session_status('active')
            await self.send(text_data=json.dumps({
                'type': 'resumed',
                'message': 'Session resumed'
            }))
        
        elif msg_type == 'capture':
            # Capture will be handled by REST API endpoint
            # Just acknowledge here
            await self.send(text_data=json.dumps({
                'type': 'capture_acknowledged',
                'message': 'Capture request received'
            }))
        
        elif msg_type == 'ping':
            # Heartbeat from client
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': data.get('timestamp')
            }))
    
    async def send_error(self, error_code: str, message: str):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'error_code': error_code,
            'message': message
        }))
    
    # Database operations (must be wrapped in database_sync_to_async)
    
    @database_sync_to_async
    def get_session(self, session_id: str):
        """Retrieve session from database."""
        try:
            return TryOnSession.objects.select_related(
                'nail_reference_post'
            ).get(session_id=session_id)
        except TryOnSession.DoesNotExist:
            return None
    
    @database_sync_to_async
    def update_session_status(self, status: str):
        """Update session status."""
        self.session.status = status
        self.session.save(update_fields=['status', 'updated_at'])
    
    @database_sync_to_async
    def update_session_stats(self, stats: dict):
        """Update session statistics."""
        self.session.stats = stats
        self.session.save(update_fields=['stats', 'updated_at'])

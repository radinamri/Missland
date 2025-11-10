"""
AI Try-On Client

Manages WebSocket communication with the AI microservice.
Forwards camera frames and receives processed results.
"""

import aiohttp
import asyncio
import logging
import json
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class AITryOnClient:
    """
    WebSocket client for communicating with the AI try-on microservice.
    
    Each Django consumer instance maintains one AITryOnClient to bridge
    the frontend and AI service.
    """
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.ai_service_url = settings.AI_TRYON_SERVICE_URL
        self.connected = False
        self.heartbeat_task: Optional[asyncio.Task] = None
        
    async def connect(self, nail_reference_url: str) -> bool:
        """
        Establish WebSocket connection to AI service.
        
        Args:
            nail_reference_url: URL of the nail reference image
            
        Returns:
            bool: True if connected successfully
        """
        try:
            self.session = aiohttp.ClientSession()
            
            # Connect to AI service WebSocket
            self.ws = await self.session.ws_connect(
                f"{self.ai_service_url}/ws/tryon/{self.session_id}",
                timeout=10.0,
                heartbeat=30.0
            )
            
            # Send initialization message with nail reference
            init_message = {
                'type': 'init',
                'session_id': self.session_id,
                'nail_reference_url': nail_reference_url,
                'timestamp': asyncio.get_event_loop().time()
            }
            
            await self.ws.send_json(init_message)
            
            # Wait for acknowledgment
            response = await asyncio.wait_for(
                self.ws.receive_json(),
                timeout=5.0
            )
            
            if response.get('type') == 'ready':
                self.connected = True
                logger.info(f"AI service connected for session {self.session_id}")
                
                # Start heartbeat
                self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                return True
            else:
                logger.error(f"AI service returned unexpected response: {response}")
                return False
                
        except asyncio.TimeoutError:
            logger.error(f"Timeout connecting to AI service for session {self.session_id}")
            await self.disconnect()
            return False
        except Exception as e:
            logger.error(f"Error connecting to AI service: {str(e)}")
            await self.disconnect()
            return False
    
    async def send_frame(self, frame_data: bytes, frame_number: int) -> None:
        """
        Send camera frame to AI service for processing.
        
        Args:
            frame_data: Binary image data (WebP format)
            frame_number: Frame sequence number
        """
        if not self.connected or not self.ws:
            raise RuntimeError("Not connected to AI service")
        
        try:
            # Create header (1024 bytes fixed size)
            header = {
                'type': 'frame',
                'session_id': self.session_id,
                'frame_number': frame_number,
                'timestamp': asyncio.get_event_loop().time(),
                'image_size': len(frame_data)
            }
            
            header_json = json.dumps(header).encode('utf-8')
            header_padded = header_json.ljust(1024, b'\x00')
            
            # Send binary message: header + image data
            await self.ws.send_bytes(header_padded + frame_data)
            
        except Exception as e:
            logger.error(f"Error sending frame to AI service: {str(e)}")
            raise
    
    async def receive_result(self) -> Optional[Dict[str, Any]]:
        """
        Receive processed frame from AI service.
        
        Returns:
            dict: Processed frame data with header and image, or None if error
        """
        if not self.connected or not self.ws:
            return None
        
        try:
            msg = await self.ws.receive()
            
            if msg.type == aiohttp.WSMsgType.BINARY:
                # Parse binary message
                data = msg.data
                
                # Extract header (first 1024 bytes)
                header_data = data[:1024].rstrip(b'\x00')
                header = json.loads(header_data.decode('utf-8'))
                
                # Extract image data
                image_data = data[1024:]
                
                return {
                    'header': header,
                    'image': image_data
                }
                
            elif msg.type == aiohttp.WSMsgType.TEXT:
                # Handle JSON messages (errors, status updates)
                return json.loads(msg.data)
                
            elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                logger.warning(f"AI service WebSocket closed: {msg.type}")
                self.connected = False
                return None
                
        except Exception as e:
            logger.error(f"Error receiving from AI service: {str(e)}")
            return None
    
    async def disconnect(self) -> None:
        """Close the WebSocket connection and cleanup."""
        self.connected = False
        
        # Cancel heartbeat task
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            try:
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass
        
        # Close WebSocket
        if self.ws:
            await self.ws.close()
            self.ws = None
        
        # Close session
        if self.session:
            await self.session.close()
            self.session = None
        
        logger.info(f"AI service disconnected for session {self.session_id}")
    
    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeat to keep connection alive."""
        try:
            while self.connected:
                await asyncio.sleep(20)  # Send every 20 seconds
                
                if self.ws and not self.ws.closed:
                    await self.ws.send_json({
                        'type': 'ping',
                        'timestamp': asyncio.get_event_loop().time()
                    })
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Heartbeat error: {str(e)}")

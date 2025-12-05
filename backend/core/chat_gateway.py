"""
Chat Gateway - Proxy layer between Django and RAG Service (nail-rag-master)

This module implements the Gateway Pattern for integrating the FastAPI RAG service
with the Django backend. All chat-related requests go through Django for:
- Unified authentication
- Consistent error handling
- Rate limiting (future)
- Analytics/logging
"""
import httpx
import asyncio
import logging
from typing import Optional, Any, Dict
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger('core.chat_gateway')


class RAGServiceProxy:
    """
    Proxy class for communicating with the RAG service.
    Implements retry logic, error handling, and fallback responses.
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'RAG_SERVICE_URL', 'http://127.0.0.1:8001')
        self.timeout = getattr(settings, 'RAG_SERVICE_TIMEOUT', 30.0)
        self.max_retries = getattr(settings, 'RAG_SERVICE_MAX_RETRIES', 3)
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict] = None,
        files: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make an async HTTP request to the RAG service with retry logic.
        """
        url = f"{self.base_url}{endpoint}"
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    if method.upper() == 'GET':
                        response = await client.get(url)
                    elif method.upper() == 'POST':
                        if files:
                            response = await client.post(url, files=files, data=data)
                        else:
                            response = await client.post(url, json=json_data)
                    elif method.upper() == 'DELETE':
                        response = await client.delete(url)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")
                    
                    response.raise_for_status()
                    return response.json()
                    
            except httpx.TimeoutException as e:
                last_error = e
                logger.warning(f"RAG service timeout (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"RAG service HTTP error: {e.response.status_code} - {e.response.text}")
                raise
                
            except httpx.ConnectError as e:
                last_error = e
                logger.error(f"Cannot connect to RAG service at {url}: {e}")
                raise
                
            except Exception as e:
                last_error = e
                logger.error(f"Unexpected error calling RAG service: {e}")
                raise
        
        # All retries exhausted
        raise last_error or Exception("RAG service request failed after retries")
    
    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """
        Generate a graceful fallback response when RAG service is unavailable.
        """
        return {
            "answer": "I'm sorry, I'm having trouble connecting to my knowledge base right now. "
                     "Please try again in a moment, or browse our nail designs directly in the Explore section.",
            "language": "en",
            "context_sources": [],
            "image_analyzed": False,
            "tokens_used": 0,
            "error": error_message,
            "explore_link": "/home"  # Fallback to home page
        }
    
    async def create_conversation(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new conversation in the RAG service."""
        return await self._make_request(
            'POST',
            '/api/chat/conversation',
            json_data={'user_id': user_id}
        )
    
    async def send_message(
        self,
        conversation_id: str,
        message: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a text message to the RAG service."""
        return await self._make_request(
            'POST',
            '/api/chat/message',
            json_data={
                'conversation_id': conversation_id,
                'message': message,
                'user_id': user_id
            }
        )
    
    async def send_image(
        self,
        conversation_id: str,
        image_data: bytes,
        filename: str,
        content_type: str,
        message: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an image to the RAG service for analysis."""
        files = {
            'image': (filename, image_data, content_type)
        }
        data = {
            'conversation_id': conversation_id,
        }
        if message:
            data['message'] = message
        if user_id:
            data['user_id'] = user_id
            
        return await self._make_request(
            'POST',
            '/api/chat/image',
            files=files,
            data=data
        )
    
    async def get_conversation_history(self, conversation_id: str) -> Dict[str, Any]:
        """Get conversation history from the RAG service."""
        return await self._make_request(
            'GET',
            f'/api/chat/conversation/{conversation_id}/history'
        )
    
    async def clear_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """Clear a conversation from the RAG service."""
        return await self._make_request(
            'DELETE',
            f'/api/chat/conversation/{conversation_id}'
        )
    
    async def check_health(self) -> Dict[str, Any]:
        """Check RAG service health."""
        return await self._make_request('GET', '/health')


# Singleton instance
rag_proxy = RAGServiceProxy()


def run_async(coro):
    """Helper to run async code in sync Django views."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


class ChatConversationView(APIView):
    """
    Create a new chat conversation.
    POST /api/auth/chat/conversation/
    """
    permission_classes = [AllowAny]  # Allow anonymous users to chat
    
    def post(self, request):
        try:
            # Use authenticated user ID if available
            user_id = None
            if request.user.is_authenticated:
                user_id = str(request.user.id)
            else:
                user_id = request.data.get('user_id')
            
            result = run_async(rag_proxy.create_conversation(user_id))
            return Response(result, status=status.HTTP_201_CREATED)
            
        except httpx.ConnectError:
            logger.error("RAG service is unavailable")
            return Response(
                {"error": "Chat service is temporarily unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatMessageView(APIView):
    """
    Send a message in a conversation.
    POST /api/auth/chat/message/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        message = request.data.get('message')
        
        if not conversation_id:
            return Response(
                {"error": "conversation_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message:
            return Response(
                {"error": "message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = None
            if request.user.is_authenticated:
                user_id = str(request.user.id)
            else:
                user_id = request.data.get('user_id')
            
            result = run_async(rag_proxy.send_message(
                conversation_id=conversation_id,
                message=message,
                user_id=user_id
            ))
            
            # Ensure response has required fields
            if 'answer' not in result:
                logger.warning(f"RAG service response missing 'answer' field: {result}")
                result['answer'] = result.get('content', '')
            
            if 'conversation_id' not in result:
                result['conversation_id'] = conversation_id
                
            return Response(result, status=status.HTTP_200_OK)
            
        except httpx.ConnectError as e:
            logger.error(f"RAG service connection error: {e}")
            fallback = rag_proxy._get_fallback_response("RAG service unavailable")
            fallback['conversation_id'] = conversation_id
            return Response(fallback, status=status.HTTP_200_OK)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"RAG service HTTP error {e.response.status_code}: {e.response.text}")
            fallback = rag_proxy._get_fallback_response(f"RAG service error: {e.response.status_code}")
            fallback['conversation_id'] = conversation_id
            return Response(fallback, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error sending message: {type(e).__name__}: {e}", exc_info=True)
            fallback = rag_proxy._get_fallback_response(f"Error: {str(e)}")
            fallback['conversation_id'] = conversation_id
            return Response(fallback, status=status.HTTP_200_OK)


class ChatImageUploadView(APIView):
    """
    Upload an image for analysis.
    POST /api/auth/chat/image/
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        image = request.FILES.get('image')
        message = request.data.get('message', 'Analyze this nail image and provide advice.')
        
        if not conversation_id:
            return Response(
                {"error": "conversation_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not image:
            return Response(
                {"error": "image file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate image type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {"error": "Invalid image format. Supported: JPEG, PNG, WebP"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate image size (5MB max)
        max_size = 5 * 1024 * 1024
        if image.size > max_size:
            return Response(
                {"error": "Image size too large. Maximum size is 5MB"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = None
            if request.user.is_authenticated:
                user_id = str(request.user.id)
            else:
                user_id = request.data.get('user_id')
            
            image_data = image.read()
            
            result = run_async(rag_proxy.send_image(
                conversation_id=conversation_id,
                image_data=image_data,
                filename=image.name,
                content_type=image.content_type,
                message=message,
                user_id=user_id
            ))
            
            # Ensure response has required fields
            if 'answer' not in result:
                logger.warning(f"RAG service response missing 'answer' field: {result}")
                result['answer'] = result.get('content', '')
                
            if 'conversation_id' not in result:
                result['conversation_id'] = conversation_id
            
            return Response(result, status=status.HTTP_200_OK)
            
        except httpx.ConnectError as e:
            logger.error(f"RAG service connection error: {e}")
            fallback = rag_proxy._get_fallback_response("RAG service unavailable")
            fallback['conversation_id'] = conversation_id
            fallback['image_analyzed'] = False
            return Response(fallback, status=status.HTTP_200_OK)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"RAG service HTTP error {e.response.status_code}: {e.response.text}")
            fallback = rag_proxy._get_fallback_response(f"RAG service error: {e.response.status_code}")
            fallback['conversation_id'] = conversation_id
            fallback['image_analyzed'] = False
            return Response(fallback, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error uploading image: {type(e).__name__}: {e}", exc_info=True)
            fallback = rag_proxy._get_fallback_response(f"Error: {str(e)}")
            fallback['conversation_id'] = conversation_id
            fallback['image_analyzed'] = False
            return Response(fallback, status=status.HTTP_200_OK)


class ChatConversationHistoryView(APIView):
    """
    Get conversation history.
    GET /api/auth/chat/conversation/<conversation_id>/history/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, conversation_id):
        try:
            result = run_async(rag_proxy.get_conversation_history(conversation_id))
            return Response(result, status=status.HTTP_200_OK)
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(
                {"error": f"RAG service error: {e.response.status_code}"},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except httpx.ConnectError:
            return Response(
                {"error": "Chat service is temporarily unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatConversationClearView(APIView):
    """
    Clear a conversation.
    DELETE /api/auth/chat/conversation/<conversation_id>/
    """
    permission_classes = [AllowAny]
    
    def delete(self, request, conversation_id):
        try:
            result = run_async(rag_proxy.clear_conversation(conversation_id))
            return Response(result, status=status.HTTP_200_OK)
            
        except httpx.ConnectError:
            return Response(
                {"error": "Chat service is temporarily unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error clearing conversation: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHealthView(APIView):
    """
    Check chat service health.
    GET /api/auth/chat/health/
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            result = run_async(rag_proxy.check_health())
            return Response(result, status=status.HTTP_200_OK)
        except httpx.ConnectError:
            return Response(
                {"status": "unavailable", "system_ready": False},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"status": "error", "system_ready": False, "error": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

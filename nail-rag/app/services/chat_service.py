"""
Chat Service - Integrates RAG, image, and conversation services
"""
from typing import Dict, Any, Optional, List, AsyncGenerator
import uuid
from app.services.rag_service import rag_service
from app.services.image_service import image_service
from app.services.conversation_manager import conversation_manager
from app.constants import CONVERSATION_HISTORY_LIMIT
from app.logger import get_logger
from app.utils.link_generator import extract_nail_parameters, generate_explore_link

logger = get_logger("chat_service")


class ChatService:
    """Service for handling chat interactions."""
    
    def __init__(self):
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize chat service and dependencies."""
        if self._initialized:
            return
        
        try:
            await conversation_manager.initialize()
            self._initialized = True
            logger.info("✅ Chat service initialized")
        except Exception as e:
            logger.error(f"❌ Error initializing chat service: {e}")
            raise
    
    async def process_message(
        self,
        conversation_id: str,
        message: str,
        image_data: Optional[bytes] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and generate response.
        
        Args:
            conversation_id: Conversation UUID
            message: User message text
            image_data: Optional image file bytes
            user_id: Optional user ID
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            await self.initialize()
            
            # Step 1: Get conversation history and message count
            recent_context = conversation_manager.get_recent_context(conversation_id)
            stats = conversation_manager.get_conversation_stats(conversation_id)
            user_message_count = stats.get("user_messages", 0)
            
            # Step 2: Analyze image if provided
            image_context = None
            if image_data:
                logger.info("🖼️ Analyzing image...")
                image_result = await image_service.analyze_nail_image(image_data, message)
                if image_result.get("analysis"):
                    image_context = image_result["analysis"]
                    logger.info("✅ Image analysis completed")
            
            # Step 3: Process query with RAG
            logger.info(f"🔍 Processing query with RAG...")
            rag_response = await rag_service.process_query(
                query=message,
                conversation_history=recent_context,
                image_context=image_context,
                user_message_count=user_message_count
            )
            
            answer = rag_response.get("answer", "I apologize, but I couldn't generate a response.")
            
            # Step 4: Add messages to conversation
            user_message_id = conversation_manager.add_message(
                conversation_id=conversation_id,
                role="user",
                content=message,
                image_analysis=image_context
            )
            
            assistant_message_id = conversation_manager.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=answer
            )
            
            # Step 5: Extract parameters and generate explore link if applicable
            explore_link = None
            recommendation_filters = None
            try:
                # Get full conversation history including the messages we just added
                full_history = conversation_manager.get_recent_context(conversation_id)
                if full_history:
                    # Extract parameters from conversation
                    parameters = await extract_nail_parameters(
                        conversation_history=full_history,
                        current_message=message,
                        assistant_response=answer,
                        image_context=image_context
                    )
                    
                    if parameters:
                        # Generate explore link
                        explore_link = generate_explore_link(parameters)
                        if explore_link:
                            logger.info(f"🔗 Generated explore link for conversation {conversation_id[:8]}...")
                        
                        # Build recommendation_filters for frontend
                        recommendation_filters = {
                            "shapes": [parameters.get("shape")] if parameters.get("shape") else [],
                            "colors": parameters.get("colors", []),
                            "patterns": [parameters.get("pattern")] if parameters.get("pattern") else [],
                            "sizes": [parameters.get("size")] if parameters.get("size") else [],
                            "confidence": parameters.get("confidence", 0.0),
                            "reason": parameters.get("reason")
                        }
                        logger.info(f"📊 Extracted recommendation filters: {recommendation_filters}")
            except Exception as e:
                logger.warning(f"⚠️ Error generating explore link: {e}")
                import traceback
                logger.warning(traceback.format_exc())
                # Don't fail the request if link generation fails
            
            # Build response
            response = {
                "conversation_id": conversation_id,
                "message_id": assistant_message_id,
                "answer": answer,
                "image_analysis": image_context,  # Include image analysis text
                "recommendation_filters": recommendation_filters,  # Include structured filters
                "context_sources": rag_response.get("context_sources", []),
                "image_analyzed": image_data is not None,
                "tokens_used": rag_response.get("tokens_used", 0),
                "explore_link": explore_link,
            }
            
            logger.info(f"✅ Generated response for conversation {conversation_id[:8]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error processing message: {e}")
            return {
                "conversation_id": conversation_id,
                "answer": "I apologize, but I encountered an error processing your message. Please try again.",
                "error": str(e)
            }
    
    async def stream_response(
        self,
        conversation_id: str,
        message: str,
        image_data: Optional[bytes] = None,
        user_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream response tokens as they're generated.
        
        Args:
            conversation_id: Conversation UUID
            message: User message text
            image_data: Optional image file bytes
            user_id: Optional user ID
            
        Yields:
            Response tokens as strings
        """
        try:
            await self.initialize()
            
            # Step 1: Get conversation history and message count
            recent_context = conversation_manager.get_recent_context(conversation_id)
            stats = conversation_manager.get_conversation_stats(conversation_id)
            user_message_count = stats.get("user_messages", 0)
            
            # Step 2: Analyze image if provided
            image_context = None
            if image_data:
                image_result = await image_service.analyze_nail_image(image_data, message)
                if image_result.get("analysis"):
                    image_context = image_result["analysis"]
            
            # Step 3: Retrieve context
            context = await rag_service.retrieve_context(
                query=message,
                limit=8
            )
            
            # Generate streaming response
            from app.utils.openai_client import get_openai_client
            from app.utils.prompt_loader import get_prompt
            
            system_prompt = get_prompt("rag_system")
            formatted_context = rag_service._format_context(context)
            
            system_message = f"""{system_prompt}

## Retrieved Context:
{formatted_context}

## Conversation History:
You have access to the conversation history below. Use it to provide context-aware responses:
- Reference previous topics we discussed when relevant
- Build on information the user shared earlier (skin tone, preferences, occasions, etc.)
- Make the conversation feel continuous and natural
- Remember what the user mentioned in previous messages

## Instructions:
- Answer based on the retrieved context above
- When the retrieved context doesn't fully answer the question, ask thoughtful follow-up questions to better understand the user's needs
- Provide specific, actionable advice with color names, shape recommendations, and styling tips
- Respond in the same language as the user's query (detect automatically)
- Be warm, friendly, and conversational - like chatting with a knowledgeable friend
- This is the user's message number: {user_message_count}
"""
            
            if image_context:
                system_message += f"\n## Image Analysis:\n{image_context}\n"
            
            messages = [
                {"role": "system", "content": system_message}
            ]
            
            if recent_context:
                history_limit = min(CONVERSATION_HISTORY_LIMIT, len(recent_context))
                for msg in recent_context[-history_limit:]:
                    messages.append(msg)
            
            messages.append({"role": "user", "content": message})
            
            # Stream response
            client = get_openai_client()
            full_response = ""
            
            from app.config import settings
            
            async for chunk in client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=settings.temperature_rag,
                max_completion_tokens=settings.max_tokens_response,
                stream=True
            ):
                if chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield token
            
            # Add messages to conversation after streaming completes
            conversation_manager.add_message(
                conversation_id=conversation_id,
                role="user",
                content=message,
                image_analysis=image_context
            )
            
            conversation_manager.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_response
            )
            
        except Exception as e:
            logger.error(f"❌ Error streaming response: {e}")
            yield f"Error: {str(e)}"
    
    async def create_conversation(self, user_id: Optional[str] = None) -> str:
        """
        Create a new conversation.
        
        Args:
            user_id: Optional user ID
            
        Returns:
            Conversation UUID
        """
        conversation_id = str(uuid.uuid4())
        logger.info(f"✅ Created new conversation: {conversation_id[:8]}...")
        return conversation_id
    
    async def get_conversation_history(
        self,
        conversation_id: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get conversation history from short-term memory.
        
        Args:
            conversation_id: Conversation UUID
            
        Returns:
            List of messages or None
        """
        return await conversation_manager.get_conversation_history(conversation_id)
    
    def clear_conversation(self, conversation_id: str) -> None:
        """
        Clear conversation from short-term memory.
        
        Args:
            conversation_id: Conversation UUID
        """
        conversation_manager.clear_short_term(conversation_id)
        logger.info(f"✅ Cleared conversation {conversation_id[:8]}...")


# Global instance
chat_service = ChatService()


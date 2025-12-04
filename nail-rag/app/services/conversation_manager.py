"""
Conversation Manager - Short-term memory management
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
from app.constants import SHORT_TERM_MEMORY_LIMIT
from app.logger import get_logger

logger = get_logger("conversation_manager")


class ConversationManager:
    """Manages conversation memory (short-term only)."""
    
    def __init__(self):
        # Short-term memory: conversation_id -> list of last N messages
        self._short_term_memory: Dict[str, List[Dict[str, Any]]] = {}
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize conversation manager."""
        if self._initialized:
            return
        
        self._initialized = True
        logger.info("✅ Conversation manager initialized")
    
    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        message_id: Optional[str] = None,
        image_url: Optional[str] = None,
        image_analysis: Optional[str] = None
    ) -> str:
        """
        Add message to short-term memory.
        
        Args:
            conversation_id: Conversation UUID
            role: Message role ('user' or 'assistant')
            content: Message content
            message_id: Optional message UUID
            image_url: Optional image URL
            image_analysis: Optional image analysis text
            
        Returns:
            Message UUID
        """
        if message_id is None:
            message_id = str(uuid.uuid4())
        
        message = {
            "message_id": message_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "image_url": image_url,
            "image_analysis": image_analysis,
        }
        
        # Initialize conversation if needed
        if conversation_id not in self._short_term_memory:
            self._short_term_memory[conversation_id] = []
        
        # Add message
        self._short_term_memory[conversation_id].append(message)
        
        # Keep only last N messages
        if len(self._short_term_memory[conversation_id]) > SHORT_TERM_MEMORY_LIMIT:
            self._short_term_memory[conversation_id] = self._short_term_memory[conversation_id][-SHORT_TERM_MEMORY_LIMIT:]
        
        logger.debug(f"✅ Added message to conversation {conversation_id[:8]}... ({len(self._short_term_memory[conversation_id])} messages)")
        
        return message_id
    
    def get_recent_context(self, conversation_id: str) -> List[Dict[str, str]]:
        """
        Get recent conversation context (last N messages).
        
        Args:
            conversation_id: Conversation UUID
            
        Returns:
            List of message dictionaries (role, content)
        """
        if conversation_id not in self._short_term_memory:
            return []
        
        messages = self._short_term_memory[conversation_id]
        
        # Return in format expected by RAG service
        return [
            {
                "role": msg["role"],
                "content": msg["content"]
            }
            for msg in messages
        ]
    
    async def get_conversation_history(
        self,
        conversation_id: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve conversation history from short-term memory.
        
        Args:
            conversation_id: Conversation UUID
            
        Returns:
            List of messages or None if not found
        """
        if conversation_id not in self._short_term_memory:
            return None
        
        messages = self._short_term_memory[conversation_id]
        
        # Return in format expected by API
        history = []
        for msg in messages:
            history.append({
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg.get("timestamp"),
            })
        
        logger.debug(f"✅ Retrieved {len(history)} messages from conversation {conversation_id[:8]}...")
        return history
    
    def clear_short_term(self, conversation_id: str) -> None:
        """
        Clear short-term memory for a conversation.
        
        Args:
            conversation_id: Conversation UUID
        """
        if conversation_id in self._short_term_memory:
            del self._short_term_memory[conversation_id]
            logger.debug(f"✅ Cleared short-term memory for conversation {conversation_id[:8]}...")
    
    def get_conversation_stats(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get statistics for a conversation.
        
        Args:
            conversation_id: Conversation UUID
            
        Returns:
            Dictionary with statistics
        """
        if conversation_id not in self._short_term_memory:
            return {
                "message_count": 0,
                "user_messages": 0,
                "assistant_messages": 0,
            }
        
        messages = self._short_term_memory[conversation_id]
        
        return {
            "message_count": len(messages),
            "user_messages": sum(1 for msg in messages if msg["role"] == "user"),
            "assistant_messages": sum(1 for msg in messages if msg["role"] == "assistant"),
        }


# Global instance
conversation_manager = ConversationManager()


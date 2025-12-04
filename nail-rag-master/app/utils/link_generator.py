"""
Link Generator Utility - Extract nail parameters and generate explore links
"""
from typing import Dict, Any, Optional, List
import json
from urllib.parse import urlencode
from app.utils.openai_client import get_openai_client
from app.utils.prompt_loader import get_prompt
from app.config import settings
from app.logger import get_logger

logger = get_logger("link_generator")

# Valid parameter values
VALID_SHAPES = {"almond", "square", "round", "coffin", "stiletto"}
VALID_PATTERNS = {"french", "glossy", "matte", "ombre", "mixed"}
VALID_SIZES = {"short", "medium", "long"}
VALID_COLORS = {
    "red", "pink", "orange", "yellow", "green", "turquoise", 
    "blue", "purple", "cream", "brown", "white", "gray", "black", "unknown"
}


def validate_shape(shape: Optional[str]) -> bool:
    """Validate shape parameter."""
    return shape is not None and shape.lower() in VALID_SHAPES


def validate_pattern(pattern: Optional[str]) -> bool:
    """Validate pattern parameter."""
    return pattern is not None and pattern.lower() in VALID_PATTERNS


def validate_size(size: Optional[str]) -> bool:
    """Validate size parameter."""
    return size is not None and size.lower() in VALID_SIZES


def validate_colors(colors: Optional[List[str]]) -> bool:
    """Validate colors parameter."""
    if not colors or not isinstance(colors, list):
        return False
    return all(color.lower() in VALID_COLORS for color in colors if color)


async def extract_nail_parameters(
    conversation_history: List[Dict[str, str]],
    current_message: str,
    assistant_response: str,
    image_context: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Extract nail design parameters from conversation using LLM.
    
    Args:
        conversation_history: Previous conversation messages
        current_message: Current user message
        assistant_response: Assistant's response
        image_context: Optional image analysis context
        
    Returns:
        Dictionary with extracted parameters if sufficient info exists, None otherwise
    """
    try:
        client = get_openai_client()
        
        # Build conversation context for analysis
        conversation_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role = msg.get("role", "user")
                content = msg.get("content", "")
                conversation_text += f"{role.capitalize()}: {content}\n\n"
        
        conversation_text += f"User: {current_message}\n\n"
        conversation_text += f"Assistant: {assistant_response}\n"
        
        if image_context:
            conversation_text += f"\nImage Analysis: {image_context}\n"
        
        # Load extraction prompt from file
        extraction_prompt = get_prompt("parameter_extraction", conversation_text=conversation_text)

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a parameter extraction assistant. Extract nail design parameters from conversations and return ONLY valid JSON."
                },
                {
                    "role": "user",
                    "content": extraction_prompt
                }
            ],
            temperature=0.2,  # Low temperature for consistent extraction
            max_completion_tokens=300,
            response_format={"type": "json_object"}  # Force JSON output
        )
        
        result_text = response.choices[0].message.content
        result = json.loads(result_text)
        
        # Validate extracted parameters
        shape = result.get("shape")
        pattern = result.get("pattern")
        size = result.get("size")
        colors = result.get("colors", [])
        confidence = result.get("confidence", 0.0)
        
        # Only return if we have at least some parameters and confidence > 0.3
        if confidence < 0.3:
            logger.debug("Low confidence in parameter extraction, skipping link generation")
            return None
        
        # Validate all parameters
        validated_params = {}
        if shape and validate_shape(shape):
            validated_params["shape"] = shape.lower()
        if pattern and validate_pattern(pattern):
            validated_params["pattern"] = pattern.lower()
        if size and validate_size(size):
            validated_params["size"] = size.lower()
        if colors:
            validated_colors = [c.lower() for c in colors if validate_colors([c])]
            if validated_colors:
                validated_params["colors"] = validated_colors
        
        # Need at least one parameter to generate link
        if not validated_params:
            logger.debug("No valid parameters extracted")
            return None
        
        # Update result with only validated parameters (remove invalid ones)
        result = {
            "shape": validated_params.get("shape"),
            "pattern": validated_params.get("pattern"),
            "size": validated_params.get("size"),
            "colors": validated_params.get("colors", []),
            "confidence": confidence,
            "reason": result.get("reason", "")
        }
        logger.info(f"✅ Extracted parameters: {validated_params} (confidence: {confidence:.2f})")
        return result
        
    except json.JSONDecodeError as e:
        logger.warning(f"⚠️ Failed to parse extraction result as JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Error extracting nail parameters: {e}")
        return None


def generate_explore_link(parameters: Dict[str, Any]) -> Optional[str]:
    """
    Generate explore link from extracted parameters.
    
    Args:
        parameters: Dictionary with shape, pattern, size, colors
        
    Returns:
        Explore link URL or None if insufficient parameters
    """
    try:
        base_url = getattr(settings, "EXPLORE_BASE_URL", "http://46.249.102.155")
        
        # Build query parameters
        query_params = {}
        
        if "shape" in parameters:
            query_params["shape"] = parameters["shape"]
        
        if "pattern" in parameters:
            query_params["pattern"] = parameters["pattern"]
        
        if "size" in parameters:
            query_params["size"] = parameters["size"]
        
        if "colors" in parameters and parameters["colors"]:
            # Join colors with comma
            query_params["colors"] = ",".join(parameters["colors"])
        
        # Need at least one parameter
        if not query_params:
            return None
        
        # Build URL
        url = f"{base_url}/filter/?{urlencode(query_params)}"
        logger.info(f"✅ Generated explore link: {url}")
        return url
        
    except Exception as e:
        logger.error(f"❌ Error generating explore link: {e}")
        return None


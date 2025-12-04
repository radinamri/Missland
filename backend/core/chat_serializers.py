"""
Serializers for Chat API responses.

These serializers ensure consistent response formatting between
the Django gateway and the RAG service.
"""
from rest_framework import serializers


class ContextSourceSerializer(serializers.Serializer):
    """Serializer for context sources in chat responses."""
    title = serializers.CharField()
    category = serializers.CharField(allow_blank=True)
    score = serializers.FloatField()


class ConversationCreateResponseSerializer(serializers.Serializer):
    """Response for creating a new conversation."""
    conversation_id = serializers.CharField()


class ChatMessageResponseSerializer(serializers.Serializer):
    """Response for sending a chat message."""
    conversation_id = serializers.CharField()
    message_id = serializers.CharField(required=False)
    answer = serializers.CharField()
    language = serializers.CharField(default='en')
    context_sources = ContextSourceSerializer(many=True, required=False)
    image_analyzed = serializers.BooleanField(default=False)
    image_analysis = serializers.CharField(required=False, allow_null=True)
    tokens_used = serializers.IntegerField(default=0)
    error = serializers.CharField(required=False, allow_null=True)
    explore_link = serializers.CharField(required=False, allow_null=True)


class ConversationMessageSerializer(serializers.Serializer):
    """Serializer for individual messages in conversation history."""
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField()
    timestamp = serializers.CharField(required=False)
    image_analysis = serializers.CharField(required=False, allow_null=True)


class ConversationHistoryResponseSerializer(serializers.Serializer):
    """Response for getting conversation history."""
    conversation_id = serializers.CharField()
    messages = ConversationMessageSerializer(many=True)
    message_count = serializers.IntegerField()


class ChatHealthResponseSerializer(serializers.Serializer):
    """Response for health check."""
    status = serializers.CharField()
    system_ready = serializers.BooleanField()
    weaviate_connected = serializers.BooleanField(required=False)
    openai_configured = serializers.BooleanField(required=False)


class ChatErrorSerializer(serializers.Serializer):
    """Error response serializer."""
    error = serializers.CharField()
    detail = serializers.CharField(required=False)

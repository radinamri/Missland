"""
Try-On WebSocket URL Routing
"""

from django.urls import re_path
from .consumers import TryOnConsumer

websocket_urlpatterns = [
    re_path(r'ws/tryon/(?P<session_id>[0-9a-f-]+)/$', TryOnConsumer.as_asgi()),
]

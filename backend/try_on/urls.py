"""
Try-On REST API URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TryOnSessionViewSet, TryOnResultViewSet

router = DefaultRouter()
router.register(r'sessions', TryOnSessionViewSet, basename='tryon-session')
router.register(r'results', TryOnResultViewSet, basename='tryon-result')

urlpatterns = [
    path('', include(router.urls)),
]

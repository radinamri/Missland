# dashboard/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnotationViewSet, serve_image, UserListView, UserRoleUpdateView

router = DefaultRouter()
router.register(r'annotations', AnnotationViewSet, basename='annotation')

urlpatterns = [
    path('', include(router.urls)),
    path('images/<str:image_name>', serve_image, name='serve_image'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/role/', UserRoleUpdateView.as_view(), name='user-role-update'),
]

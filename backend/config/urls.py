from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Import the PublicPostDetailView directly from your core app
from core.views import PublicPostDetailView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Add the public API route separately. It will now be accessible at /api/public/...
    path('api/public/posts/<int:pk>/', PublicPostDetailView.as_view(), name='public-post-detail'),

    # Keep all other authenticated routes under the /api/auth/ prefix
    path('api/auth/', include('core.urls')),

    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

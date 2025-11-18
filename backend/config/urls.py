from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from core.token_views import CustomTokenObtainPairView, CustomTokenRefreshView
# Import the PublicPostDetailView directly from your core app
from core.views import PublicPostDetailView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Add the public API route separately. It will now be accessible at /api/public/...
    path('api/public/posts/<int:pk>/', PublicPostDetailView.as_view(), name='public-post-detail'),

    # Keep all other authenticated routes under the /api/auth/ prefix
    path('api/auth/', include('core.urls')),

    # Custom JWT token endpoints with multi-device support
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
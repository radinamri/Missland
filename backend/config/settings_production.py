"""
Production settings for Missland Django backend.
Configured for deployment with IP address: 46.249.102.155 (HTTP only)

This file should be used when deploying to production.
Make sure to set proper environment variables for sensitive data.
"""

from .settings import *
import os

# Security Settings
DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'CHANGE_THIS_TO_RANDOM_50_CHARS')

# ALLOWED_HOSTS for IP address deployment
ALLOWED_HOSTS = [
    '46.249.102.155',
    'localhost',
    '127.0.0.1',
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'missland_db'),
        'USER': os.environ.get('DB_USER', 'missland_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Redis Cache Configuration (Production)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True
            },
        },
        'KEY_PREFIX': 'missland',
        'TIMEOUT': 300,
    }
}

# CORS Settings for IP-only deployment
CORS_ALLOWED_ORIGINS = [
    "http://46.249.102.155",
]

CORS_ALLOW_CREDENTIALS = True

# Static files (Production)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (Production)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Security Settings (HTTP-only configuration - no SSL)
# WARNING: These are disabled for HTTP-only deployment
# Enable them if you add a domain and SSL certificate later
SECURE_SSL_REDIRECT = False  # Disabled for HTTP
SESSION_COOKIE_SECURE = False  # Disabled for HTTP
CSRF_COOKIE_SECURE = False  # Disabled for HTTP
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 0  # Disabled for HTTP
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# CSRF Settings for HTTP
CSRF_TRUSTED_ORIGINS = [
    'http://46.249.102.155',
]

# Google OAuth credentials (use environment variables)
if 'GOOGLE_CLIENT_ID' in os.environ:
    SOCIALACCOUNT_PROVIDERS['google']['APP'] = {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'key': ''
    }

# Email Configuration (Production)
# Configure your email backend here (SMTP, SendGrid, etc.)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@missland.app')

# Logging Configuration (Production)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/missland/django_error.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'core': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Sentry Integration (Optional - for error tracking)
# Uncomment and configure if using Sentry
# import sentry_sdk
# from sentry_sdk.integrations.django import DjangoIntegration
# 
# sentry_sdk.init(
#     dsn=os.environ.get('SENTRY_DSN', ''),
#     integrations=[DjangoIntegration()],
#     traces_sample_rate=0.1,
#     send_default_pii=False
# )

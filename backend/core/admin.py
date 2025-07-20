from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    """
    Configuration for the custom User model in the Django admin.
    """
    # You can customize the admin display here if needed in the future.
    # For now, we'll use the default settings from UserAdmin.
    pass


# Register your custom User model with the custom admin configuration
admin.site.register(User, CustomUserAdmin)

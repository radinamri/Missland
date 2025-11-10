from django.contrib import admin
from .models import TryOnSession, TryOnResult


@admin.register(TryOnSession)
class TryOnSessionAdmin(admin.ModelAdmin):
    list_display = [
        'session_id', 
        'user', 
        'status', 
        'created_at', 
        'expires_at',
        'is_expired'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['session_id', 'user__username']
    readonly_fields = ['session_id', 'created_at', 'updated_at', 'stats']
    
    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True


@admin.register(TryOnResult)
class TryOnResultAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'user',
        'session',
        'created_at',
        'confidence_score'
    ]
    list_filter = ['created_at']
    search_fields = ['user__username', 'session__session_id']
    readonly_fields = ['created_at']

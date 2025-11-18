"""
Authentication utilities for multi-device session management.
Handles device detection, session creation, and token management.
"""

import re
from user_agents import parse as parse_user_agent
from .models import UserSession


class DeviceDetector:
    """Detects device information from User-Agent header"""
    
    @staticmethod
    def get_device_info(user_agent: str) -> dict:
        """
        Parse User-Agent and extract device information.
        
        Args:
            user_agent: User-Agent header string
            
        Returns:
            Dict with device_name, device_type, os_name, browser_name, user_agent
        """
        try:
            ua = parse_user_agent(user_agent)
            
            # Determine device type
            if ua.is_mobile:
                device_type = 'mobile'
            elif ua.is_tablet:
                device_type = 'tablet'
            elif ua.is_pc:
                device_type = 'desktop'
            else:
                device_type = 'unknown'
            
            # Build device name
            browser_name = ua.browser.family or 'Unknown Browser'
            os_name = ua.os.family or 'Unknown OS'
            
            if ua.device.family and ua.device.family != 'Other':
                device_name = ua.device.family
            else:
                device_name = f"{browser_name} on {os_name}"
            
            return {
                'device_name': device_name,
                'device_type': device_type,
                'os_name': os_name,
                'browser_name': browser_name,
                'user_agent': user_agent,
            }
        except Exception as e:
            # Fallback if parsing fails
            return {
                'device_name': 'Unknown Device',
                'device_type': 'unknown',
                'os_name': '',
                'browser_name': '',
                'user_agent': user_agent,
            }


class SessionManager:
    """Manages user sessions across devices"""
    
    @staticmethod
    def create_device_session(user, request) -> UserSession:
        """
        Create a new session for a user on a device.
        
        Args:
            user: User instance
            request: Django request object
            
        Returns:
            UserSession instance
        """
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        ip_address = get_client_ip(request)
        device_info = DeviceDetector.get_device_info(user_agent)
        
        session = UserSession.create_session(
            user=user,
            device_info=device_info,
            ip_address=ip_address
        )
        return session
    
    @staticmethod
    def get_active_sessions(user) -> list:
        """Get all active sessions for a user"""
        return list(UserSession.objects.filter(user=user, is_active=True).order_by('-last_activity_at'))
    
    @staticmethod
    def revoke_session(session_id: str, user) -> bool:
        """
        Revoke (logout) a specific session.
        
        Args:
            session_id: UUID of session to revoke
            user: User instance (for security - verify ownership)
            
        Returns:
            True if revoked successfully, False otherwise
        """
        try:
            session = UserSession.objects.get(session_id=session_id, user=user)
            session.is_active = False
            session.save()
            return True
        except UserSession.DoesNotExist:
            return False
    
    @staticmethod
    def revoke_all_sessions(user, except_session_id=None) -> int:
        """
        Revoke all sessions for a user (logout from all devices).
        
        Args:
            user: User instance
            except_session_id: Optional session ID to keep active (current device)
            
        Returns:
            Number of sessions revoked
        """
        if except_session_id:
            revoked = UserSession.objects.filter(
                user=user,
                is_active=True
            ).exclude(session_id=except_session_id).update(is_active=False)
        else:
            revoked = UserSession.objects.filter(
                user=user,
                is_active=True
            ).update(is_active=False)
        return revoked
    
    @staticmethod
    def update_session_activity(session_id: str):
        """Update last activity timestamp for a session"""
        from django.utils.timezone import now
        try:
            UserSession.objects.filter(session_id=session_id).update(
                last_activity_at=now()
            )
        except Exception:
            pass  # Silently fail - not critical


def get_client_ip(request):
    """
    Extract client IP address from request.
    Handles proxies and CloudFlare.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

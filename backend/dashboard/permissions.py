from rest_framework.permissions import BasePermission


class IsDashboardUser(BasePermission):
    """
    Permission class for dashboard access.
    Allows users with ADMIN, ANNOTATOR, or SUPERUSER roles, or Django staff/superuser.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow superusers and staff
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Allow users with dashboard roles
        return request.user.role in ['ADMIN', 'ANNOTATOR', 'SUPERUSER']


class IsAdminOrSuperuser(BasePermission):
    """
    Permission class for admin-only operations like user management.
    Only ADMIN, SUPERUSER roles, or Django superusers can perform these actions.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow Django superusers
        if request.user.is_superuser:
            return True
        
        # Allow users with ADMIN or SUPERUSER role
        return request.user.role in ['ADMIN', 'SUPERUSER']

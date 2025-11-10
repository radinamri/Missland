from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.conf import settings
from .models import InterestProfile, Collection
import logging

logger = logging.getLogger(__name__)


# The two previous functions have been merged into this single, correct one.
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_addons(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create an InterestProfile and a default
    'All Posts' collection when a new user is created.
    Handles both PostgreSQL and MongoDB based on USE_MONGODB setting.
    """
    if created:
        # Always create InterestProfile in PostgreSQL
        InterestProfile.objects.create(user=instance)
        
        # Create default "All Posts" collection
        if getattr(settings, 'USE_MONGODB', False):
            # Create in MongoDB
            try:
                from . import db_utils
                collection_id = db_utils.create_collection(instance.id, "All Posts")
                if not collection_id:
                    logger.warning(f"Failed to create MongoDB collection for user {instance.id}")
            except Exception as e:
                logger.error(f"Error creating MongoDB collection for user {instance.id}: {e}")
                # Don't fail user creation, just log the error
        else:
            # Create in PostgreSQL
            Collection.objects.create(user=instance, name="All Posts")


@receiver(pre_delete, sender=settings.AUTH_USER_MODEL)
def cleanup_user_data(sender, instance, **kwargs):
    """
    Signal handler to clean up user data before user deletion.
    Handles MongoDB cleanup if USE_MONGODB is enabled.
    """
    if getattr(settings, 'USE_MONGODB', False):
        # Cleanup MongoDB collections and tryons
        try:
            from .mongo_manager import get_mongo_manager
            from asgiref.sync import sync_to_async
            import asyncio
            
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            mongo_manager = get_mongo_manager()
            success = loop.run_until_complete(
                sync_to_async(mongo_manager.delete_user_data)(instance.id)
            )
            
            if not success:
                logger.warning(f"Failed to delete MongoDB data for user {instance.id}")
        except Exception as e:
            logger.error(f"Error deleting MongoDB data for user {instance.id}: {e}")
            # Don't block user deletion, just log the error

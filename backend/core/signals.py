from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import InterestProfile, Collection


# The two previous functions have been merged into this single, correct one.
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_addons(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create an InterestProfile and a default
    'All Posts' collection when a new user is created.
    """
    if created:
        InterestProfile.objects.create(user=instance)
        Collection.objects.create(user=instance, name="All Posts")

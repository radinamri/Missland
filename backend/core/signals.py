from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import InterestProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_interest_profile(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create an InterestProfile when a new user is created.
    """
    if created:
        InterestProfile.objects.create(user=instance)

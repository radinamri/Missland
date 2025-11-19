from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
import requests
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social authentication that:
    - Captures Google profile pictures
    - Properly handles user data from OAuth providers
    - Logs authentication events for debugging
    """

    def pre_social_login(self, request, sociallogin):
        """
        Called before social login is processed.
        Each OAuth email is treated as a separate identity.
        """
        # Extract email from OAuth response
        email = sociallogin.account.extra_data.get('email')
        if email:
            logger.info(f"OAuth pre_social_login: provider={sociallogin.account.provider}, email={email}")
        pass

    def save_user(self, request, sociallogin, form=None):
        """
        Saves a user from social login, capturing profile picture and other data.
        """
        user = super().save_user(request, sociallogin, form)
        
        # Log the OAuth user creation
        email = sociallogin.account.extra_data.get('email', 'N/A')
        logger.info(f"OAuth user created/linked: provider={sociallogin.account.provider}, email={email}, user_id={user.id}")

        # Capture profile picture from Google
        if sociallogin.account.provider == 'google':
            self._save_google_profile_picture(user, sociallogin)

        return user

    def _save_google_profile_picture(self, user, sociallogin):
        """
        Downloads and saves Google profile picture to user model.
        """
        try:
            picture_url = sociallogin.account.extra_data.get('picture')
            if not picture_url:
                logger.warning(f"No picture URL in Google OAuth response for user {user.id}")
                return

            # Download the image with timeout protection
            response = requests.get(picture_url, stream=True, timeout=5)
            if response.status_code != 200:
                logger.warning(f"Failed to download Google picture: status={response.status_code}, url={picture_url}")
                return

            # Determine filename
            filename = picture_url.split('/')[-1].split('?')[0]
            if not filename or filename.endswith('.png'):
                filename = f"google_{user.id}.jpg"

            # Save to user's profile_picture field
            user.profile_picture.save(
                filename,
                ContentFile(response.content),
                save=True
            )
            logger.info(f"Google profile picture saved successfully for user {user.id}")

        except requests.exceptions.Timeout:
            logger.error(f"Timeout downloading Google profile picture for user {user.id}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error downloading Google profile picture: {e}")
        except Exception as e:
            logger.error(f"Unexpected error saving Google profile picture: {e}")


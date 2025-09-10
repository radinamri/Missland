from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
import requests
from django.core.files.base import ContentFile

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Overrides the default social account adapter to link accounts by email.
    """

    def pre_social_login(self, request, sociallogin):
        """
        This method is called just before the user is logged in.
        We can use it to link the social account to an existing user.
        """
        # The user object that allauth has found or created
        user = sociallogin.user

        # If the user already exists and is active, we don't need to do anything
        if user.id:
            return

        # Check if a user with this email already exists in our system
        try:
            email = sociallogin.account.extra_data['email']
            existing_user = User.objects.get(email__iexact=email)

            # If we found an existing user, we connect the social account to them
            sociallogin.connect(request, existing_user)
        except (User.DoesNotExist, KeyError):
            # If no user with this email exists, or the social account
            # doesn't provide an email, we let allauth continue with its
            # default behavior (which is to create a new user).
            pass

        def save_user(self, request, sociallogin, form=None):
            """
            Saves a newly signed up social login. Catches the picture from Google.
            """
            user = super().save_user(request, sociallogin, form)

            try:
                picture_url = sociallogin.account.extra_data.get('picture')
                if picture_url:
                    # Download the image from the URL
                    response = requests.get(picture_url, stream=True)
                    if response.status_code == 200:
                        # Get the filename from the URL
                        filename = picture_url.split('/')[-1].split('?')[0]
                        if not filename:
                            filename = f"{user.id}_google_pic.jpg"

                        # Save the image to the user's profile_picture field
                        user.profile_picture.save(filename, ContentFile(response.content), save=True)
            except Exception as e:
                # Log the error but don't block the user from signing up
                print(f"Error saving Google profile picture: {e}")

            return user

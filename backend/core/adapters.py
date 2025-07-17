from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

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

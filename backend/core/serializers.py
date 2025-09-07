import requests
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Post, Article, Collection, TryOn


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles validation and creation of a new user with only email and password.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")

    class Meta:
        model = User
        fields = ('email', 'password', 'password2')

    def validate(self, attrs):
        """
        Check that the two password entries match.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        """
        Create and return a new user with a hashed password.
        The username is automatically set to the email address.
        """
        user = User.objects.create(
            # Set username to be the same as the email
            username=validated_data['email'],
            email=validated_data['email']
        )

        user.set_password(validated_data['password'])
        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model, exposing safe fields for profile display
    and indicating whether the user has a password set.
    """
    has_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'has_password')

    def get_has_password(self, obj):
        return obj.has_usable_password()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating the user's username.
    """

    class Meta:
        model = User
        fields = ('username',)


class EmailChangeInitiateSerializer(serializers.Serializer):
    """
    Serializer to validate the new email address for the change process.
    """
    new_email = serializers.EmailField(required=True)


class EmailChangeConfirmSerializer(serializers.Serializer):
    """
    Serializer to validate the token and uid from the verification link.
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'title', 'image_url', 'width', 'height', 'tags', 'try_on_image_url')


class TryOnSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)

    class Meta:
        model = TryOn
        fields = ['id', 'post', 'created_at']


class ArticleListSerializer(serializers.ModelSerializer):
    """Serializer for listing articles with minimal info."""

    class Meta:
        model = Article
        fields = ('id', 'title', 'slug', 'thumbnail_url')


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for a single, detailed article view."""

    class Meta:
        model = Article
        fields = ('id', 'title', 'slug', 'content', 'thumbnail_url', 'published_date')


class UserDeleteSerializer(serializers.Serializer):
    """
    Serializer to confirm user identity before account deletion.
    Accepts either a password or a Google access_token.
    """
    password = serializers.CharField(required=False, allow_blank=True)
    access_token = serializers.CharField(required=False, allow_blank=True,
                                         help_text="A Google access token for re-authentication.")

    def validate(self, data):
        user = self.context['request'].user
        password = data.get('password')
        access_token = data.get('access_token')

        # Check if the user has a usable password (i.e., didn't sign up with Google)
        if user.has_usable_password():
            if not password or not user.check_password(password):
                raise serializers.ValidationError('Incorrect password. Please try again.')
        # If the user signed up with Google, they must provide a Google access token
        else:
            if not access_token:
                raise serializers.ValidationError('Google re-authentication is required to delete this account.')

            # Verify the Google access token
            try:
                response = requests.get(f'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={access_token}')
                response.raise_for_status()
                google_data = response.json()

                # Check if the email from Google matches the user's email
                if google_data.get('email') != user.email:
                    raise serializers.ValidationError('Google token is invalid or does not match the current user.')

            except requests.exceptions.RequestException:
                raise serializers.ValidationError('Failed to verify Google token. Please try again.')

        return data


class CollectionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'name']
        read_only_fields = ['id']


class CollectionListSerializer(serializers.ModelSerializer):
    # Get the first 4 post images for a collage effect
    posts_preview = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'posts_preview', 'post_count']

    def get_posts_preview(self, obj):
        # Get the most recent 4 posts from the collection
        recent_posts = obj.posts.order_by('-id')[:4]
        # Return a list of their image URLs
        return [post.image_url for post in recent_posts]

    def get_post_count(self, obj):
        return obj.posts.count()


class CollectionDetailSerializer(serializers.ModelSerializer):
    # We will use a SerializerMethodField for more explicit control
    posts = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'posts']

    def get_posts(self, obj):
        # 'obj' is the Collection instance.
        # We get all posts related to it, ordered by most recent.
        posts_queryset = obj.posts.all().order_by('-id')
        # We manually serialize that list of posts using the PostSerializer.
        return PostSerializer(posts_queryset, many=True).data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password1 = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password1'] != attrs['new_password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

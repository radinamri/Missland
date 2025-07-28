from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Post, Article


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
    Serializer for the User model, exposing safe fields for profile display.
    """

    class Meta:
        model = User
        fields = ('id', 'email', 'username')


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
        fields = ('id', 'title', 'image_url', 'width', 'height', 'tags')


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

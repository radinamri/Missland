from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    API view for user registration.
    Allows any user (even unauthenticated) to create a new account.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "user": {
                    "email": user.email,
                    "username": user.username
                },
                "message": "User created successfully. You can now log in.",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

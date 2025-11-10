from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.http import FileResponse, Http404
from bson import ObjectId
import pymongo
import json
import os
from .permissions import IsDashboardUser, IsAdminOrSuperuser
from core.models import User
from core.serializers import UserListSerializer, UserRoleUpdateSerializer


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


def serve_image(request, image_name):
    """
    Serve images from the nail_images folder
    """
    try:
        # Connect to MongoDB to get the image path
        client = pymongo.MongoClient(settings.MONGODB_SETTINGS['host'])
        db = client[settings.MONGODB_SETTINGS['database']]
        collection = db[settings.MONGODB_SETTINGS['collection']]

        # Find the document with this image name
        doc = collection.find_one({'image_name': image_name})

        if not doc or 'image_path' not in doc:
            raise Http404("Image not found")

        image_path = doc['image_path']

        # Check if file exists
        if not os.path.exists(image_path):
            raise Http404("Image file not found on disk")

        # Serve the file
        return FileResponse(open(image_path, 'rb'), content_type='image/jpeg')

    except Exception as e:
        raise Http404(f"Error serving image: {str(e)}")


class AnnotationViewSet(viewsets.ViewSet):
    """
    ViewSet for handling nail image annotations from MongoDB
    """
    permission_classes = [IsDashboardUser]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.client = pymongo.MongoClient(settings.MONGODB_SETTINGS['host'])
        self.db = self.client[settings.MONGODB_SETTINGS['database']]
        self.collection = self.db[settings.MONGODB_SETTINGS['collection']]

    def list(self, request):
        """Get all annotations with pagination"""
        try:
            # Get query parameters
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))

            # Calculate skip value
            skip = (page - 1) * page_size

            # Get total count
            total = self.collection.count_documents({})

            # Get paginated results
            cursor = self.collection.find().skip(skip).limit(page_size)
            annotations = []

            for doc in cursor:
                doc['id'] = str(doc['_id'])
                doc['_id'] = str(doc['_id'])
                annotations.append(doc)

            return Response({
                'count': total,
                'next': page + 1 if skip + page_size < total else None,
                'previous': page - 1 if page > 1 else None,
                'results': annotations
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, pk=None):
        """Get a single annotation by ID"""
        try:
            doc = self.collection.find_one({'_id': ObjectId(pk)})
            if doc:
                doc['id'] = str(doc['_id'])
                doc['_id'] = str(doc['_id'])
                return Response(doc)
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, pk=None):
        """Update an annotation"""
        try:
            update_data = request.data.copy()
            # Remove fields that shouldn't be updated
            update_data.pop('_id', None)
            update_data.pop('id', None)

            result = self.collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': update_data}
            )

            if result.matched_count > 0:
                doc = self.collection.find_one({'_id': ObjectId(pk)})
                doc['id'] = str(doc['_id'])
                doc['_id'] = str(doc['_id'])
                return Response(doc)

            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, pk=None):
        """Partially update an annotation"""
        return self.update(request, pk)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about the annotations"""
        try:
            total = self.collection.count_documents({})

            # Get shape distribution
            shapes = self.collection.aggregate([
                {'$group': {'_id': '$shape', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ])

            # Get pattern distribution
            patterns = self.collection.aggregate([
                {'$group': {'_id': '$pattern', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ])

            # Get size distribution
            sizes = self.collection.aggregate([
                {'$group': {'_id': '$size', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ])

            return Response({
                'total': total,
                'shapes': list(shapes),
                'patterns': list(patterns),
                'sizes': list(sizes)
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserListView(generics.ListAPIView):
    """
    List all users for dashboard user management.
    Requires dashboard access (ADMIN, ANNOTATOR, SUPERUSER).
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserListSerializer
    permission_classes = [IsDashboardUser]


class UserRoleUpdateView(generics.UpdateAPIView):
    """
    Update a user's role.
    Only ADMIN and SUPERUSER can update roles.
    """
    queryset = User.objects.all()
    serializer_class = UserRoleUpdateSerializer
    permission_classes = [IsAdminOrSuperuser]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return the updated user with all fields
        from core.serializers import UserListSerializer
        return Response(UserListSerializer(instance).data)


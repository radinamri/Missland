"""
Database utility functions to abstract MongoDB/PostgreSQL logic.
All MongoDB operations are now synchronous using PyMongo.
"""
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)


def _use_mongodb() -> bool:
    """Check if MongoDB should be used."""
    return getattr(settings, 'USE_MONGODB', False)


def get_mongo_manager():
    """Get MongoDB manager instance."""
    from .mongo_manager import MongoDBManager
    return MongoDBManager()


def filter_posts(
    q: Optional[str] = None,
    shape: Optional[str] = None,
    pattern: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
    enable_fallback: bool = True
) -> Dict[str, Any]:
    """Filter posts - synchronous PyMongo."""
    if _use_mongodb():
        try:
            from .keyword_extractor import extract_nail_keywords
            extracted_keywords = {}
            remaining_query = q
            if q:
                extracted_keywords, remaining_query = extract_nail_keywords(q)
            
            mongo_manager = get_mongo_manager()
            
            if enable_fallback:
                result = mongo_manager.search_with_fallback(
                    q=q, shape=shape, pattern=pattern, size=size, color=color,
                    page=page, page_size=page_size,
                    extracted_keywords=extracted_keywords,
                    remaining_query=remaining_query,
                    fallback_threshold=10
                )
            else:
                result = mongo_manager.filter_posts(
                    q=q, shape=shape, pattern=pattern, size=size, color=color,
                    page=page, page_size=page_size,
                    extracted_keywords=extracted_keywords,
                    remaining_query=remaining_query
                )
            return result
        except Exception as e:
            logger.error(f"MongoDB query failed: {e}")
    
    # PostgreSQL fallback
    from .models import Post
    from .serializers import PostSerializer
    queryset = Post.objects.all()
    posts = list(queryset.order_by('-created_at')[(page-1)*page_size:page*page_size])
    total_count = queryset.count()
    results = PostSerializer(posts, many=True).data
    import random
    return {
        'results': results,
        'count': total_count,
        'next': f'?page={page+1}' if (page*page_size) < total_count else None,
        'previous': f'?page={page-1}' if page > 1 else None,
        'seed': random.randint(1000, 9999),
    }


def get_post_by_id(post_id: str) -> Optional[Dict[str, Any]]:
    """Get post by ID - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.get_post_by_id(post_id)
        except Exception as e:
            logger.error(f"MongoDB get_post failed: {e}")
    
    from .models import Post
    from .serializers import PostSerializer
    try:
        post = Post.objects.get(id=int(post_id))
        return PostSerializer(post).data
    except (Post.DoesNotExist, ValueError):
        return None


def get_similar_posts(post_id: str, count: int = 48) -> List[Dict[str, Any]]:
    """Get similar posts - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.get_similar_posts(post_id, count)
        except Exception as e:
            logger.error(f"MongoDB get_similar_posts failed: {e}")
    
    from .models import Post
    from .serializers import PostSerializer
    try:
        posts = list(Post.objects.exclude(id=int(post_id)).order_by('?')[:count])
        return PostSerializer(posts, many=True).data
    except (Post.DoesNotExist, ValueError):
        return []


def get_user_collections(user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """Get user collections - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.get_user_collections(user_id, page, page_size)
        except Exception as e:
            logger.error(f"MongoDB get_user_collections failed: {e}")
    
    from dashboard.models import Collection
    from dashboard.serializers import CollectionSerializer
    collections = Collection.objects.filter(user_id=user_id).order_by('-created_at')
    total = collections.count()
    collections = collections[(page-1)*page_size:page*page_size]
    return {
        'results': CollectionSerializer(collections, many=True).data,
        'count': total,
        'next': f'?page={page+1}' if (page*page_size) < total else None,
        'previous': f'?page={page-1}' if page > 1 else None,
    }


def get_collection_details(collection_id: str, page: int = 1, page_size: int = 1000) -> Dict[str, Any]:
    """Get collection details - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            coll = mongo_manager.get_collection_by_id(collection_id)
            posts = mongo_manager.get_collection_posts(collection_id, page=1, page_size=1000)
            if coll is None:
                return None
            return {**coll, 'posts': posts}
        except Exception as e:
            logger.error(f"MongoDB get_collection_details failed: {e}")
    
    from dashboard.models import Collection
    from dashboard.serializers import CollectionDetailSerializer
    try:
        collection = Collection.objects.get(id=int(collection_id))
        return CollectionDetailSerializer(collection).data
    except (Collection.DoesNotExist, ValueError):
        return None


def create_collection(user_id: int, name: str, description: str = "") -> Dict[str, Any]:
    """Create collection - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.create_collection(user_id, name, description)
        except Exception as e:
            logger.error(f"MongoDB create_collection failed: {e}")
    
    from dashboard.models import Collection
    from dashboard.serializers import CollectionSerializer
    collection = Collection.objects.create(user_id=user_id, name=name, description=description)
    return CollectionSerializer(collection).data


def add_post_to_collection(collection_id: str, post_id: str, user_id: int) -> bool:
    """Add post to collection - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.add_post_to_collection(collection_id, post_id, user_id)
        except Exception as e:
            logger.error(f"MongoDB add_post_to_collection failed: {e}")
            return False
    
    from dashboard.models import Collection
    try:
        collection = Collection.objects.get(id=int(collection_id), user_id=user_id)
        collection.post_ids.append(post_id)
        collection.save()
        return True
    except (Collection.DoesNotExist, ValueError):
        return False


def remove_post_from_collection(collection_id: str, post_id: str, user_id: int) -> bool:
    """Remove post from collection - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.remove_post_from_collection(collection_id, post_id, user_id)
        except Exception as e:
            logger.error(f"MongoDB remove_post_from_collection failed: {e}")
            return False
    
    from dashboard.models import Collection
    try:
        collection = Collection.objects.get(id=int(collection_id), user_id=user_id)
        if post_id in collection.post_ids:
            collection.post_ids.remove(post_id)
            collection.save()
            return True
        return False
    except (Collection.DoesNotExist, ValueError):
        return False


def delete_collection(collection_id: str, user_id: int) -> bool:
    """Delete collection - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.delete_collection(collection_id, user_id)
        except Exception as e:
            logger.error(f"MongoDB delete_collection failed: {e}")
            return False
    
    from dashboard.models import Collection
    try:
        collection = Collection.objects.get(id=int(collection_id), user_id=user_id)
        collection.delete()
        return True
    except (Collection.DoesNotExist, ValueError):
        return False


def get_user_tryons(user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """Get user try-ons - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.get_user_tryons(user_id, page, page_size)
        except Exception as e:
            logger.error(f"MongoDB get_user_tryons failed: {e}")
    
    from try_on.models import TryOn
    from try_on.serializers import TryOnSerializer
    tryons = TryOn.objects.filter(user_id=user_id).order_by('-created_at')
    total = tryons.count()
    tryons = tryons[(page-1)*page_size:page*page_size]
    return {
        'results': TryOnSerializer(tryons, many=True).data,
        'count': total,
        'next': f'?page={page+1}' if (page*page_size) < total else None,
        'previous': f'?page={page-1}' if page > 1 else None,
    }


def create_tryon(user_id: int, post_id: str, result_url: str, hand_image_url: str) -> Dict[str, Any]:
    """Create try-on - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.create_tryon(user_id, post_id, result_url, hand_image_url)
        except Exception as e:
            logger.error(f"MongoDB create_tryon failed: {e}")
    
    from try_on.models import TryOn
    from try_on.serializers import TryOnSerializer
    tryon = TryOn.objects.create(
        user_id=user_id,
        post_id=post_id,
        result_url=result_url,
        hand_image_url=hand_image_url
    )
    return TryOnSerializer(tryon).data


def delete_tryon(tryon_id: str, user_id: int) -> bool:
    """Delete try-on - synchronous PyMongo."""
    if _use_mongodb():
        try:
            mongo_manager = get_mongo_manager()
            return mongo_manager.delete_tryon(tryon_id, user_id)
        except Exception as e:
            logger.error(f"MongoDB delete_tryon failed: {e}")
            return False
    
    from try_on.models import TryOn
    try:
        tryon = TryOn.objects.get(id=int(tryon_id), user_id=user_id)
        tryon.delete()
        return True
    except (TryOn.DoesNotExist, ValueError):
        return False

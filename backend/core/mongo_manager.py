"""
MongoDB sync manager for CRUD operations on Posts, Collections, and TryOns.
Uses PyMongo for sync operations with proper error handling.
"""
import logging
import random
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from django.conf import settings
from .mongodb_client import get_mongodb_client
from .mongo_models import PostDocument, CollectionDocument, TryOnDocument
from .color_constants import COLOR_SIMPLIFICATION_MAP
from .nail_search_client import get_nail_search_client
from functools import reduce
import operator
import re

logger = logging.getLogger(__name__)


class MongoDBManager:
    """Sync MongoDB operations manager."""
    
    def __init__(self):
        self.client = get_mongodb_client()
        self.collections_config = settings.MONGODB_SETTINGS['collections']
    
    # ==================== POST OPERATIONS ====================
    
    def get_post_by_id(self, post_id: str) -> Optional[Dict[str, Any]]:
        """Get single post by ObjectId or legacy_pg_id."""
        try:
            collection = self.client.get_collection(self.collections_config['posts'])
            
            # Try ObjectId first
            try:
                obj_id = ObjectId(post_id)
                doc = collection.find_one({'_id': obj_id})
                if doc:
                    post = PostDocument.from_mongo(doc)
                    return post.to_serializer_dict()
            except:
                pass
            
            # Try legacy_pg_id
            try:
                legacy_id = int(post_id)
                doc = collection.find_one({'legacy_pg_id': legacy_id})
                if doc:
                    post = PostDocument.from_mongo(doc)
                    return post.to_serializer_dict()
            except:
                pass
            
            return None
        except Exception as e:
            logger.error(f"Error getting post {post_id}: {e}")
            return None
    
    def filter_posts(
        self,
        q: Optional[str] = None,
        shape: Optional[str] = None,
        pattern: Optional[str] = None,
        size: Optional[str] = None,
        color: Optional[str] = None,
        page: int = 1,
        page_size: int = 48,
        extracted_keywords: Optional[Dict] = None,
        remaining_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Filter posts with pagination matching Django ORM behavior.
        Returns dict with: results, count, next, previous, seed
        """
        try:
            collection = self.client.get_collection(self.collections_config['posts'])
            
            # Build MongoDB query
            query_filters = []
            
            # Handle extracted keywords from text query
            if extracted_keywords:
                if extracted_keywords.get('shape'):
                    query_filters.append({
                        'shape': {'$regex': f"^{re.escape(extracted_keywords['shape'])}$", '$options': 'i'}
                    })
                
                if extracted_keywords.get('pattern'):
                    query_filters.append({
                        'pattern': {'$regex': f"^{re.escape(extracted_keywords['pattern'])}$", '$options': 'i'}
                    })
                
                if extracted_keywords.get('size'):
                    query_filters.append({
                        'size': {'$regex': f"^{re.escape(extracted_keywords['size'])}$", '$options': 'i'}
                    })
                
                # Color variants
                if extracted_keywords.get('color'):
                    base_color = extracted_keywords['color']
                    variants_to_find = {
                        variant for variant, base in COLOR_SIMPLIFICATION_MAP.items()
                        if base == base_color
                    }
                    if variants_to_find:
                        color_conditions = [
                            {'colors': {'$regex': variant, '$options': 'i'}}
                            for variant in variants_to_find
                        ]
                        query_filters.append({'$or': color_conditions})
            
            # Handle remaining text query (title search)
            if remaining_query:
                for term in remaining_query.split():
                    query_filters.append({
                        'title': {'$regex': re.escape(term), '$options': 'i'}
                    })
            
            # Direct filter parameters
            if shape:
                query_filters.append({
                    'shape': {'$regex': f"^{re.escape(shape)}$", '$options': 'i'}
                })
            
            if pattern:
                query_filters.append({
                    'pattern': {'$regex': f"^{re.escape(pattern)}$", '$options': 'i'}
                })
            
            if size:
                query_filters.append({
                    'size': {'$regex': f"^{re.escape(size)}$", '$options': 'i'}
                })
            
            # Multi-select color OR logic
            if color:
                colors = [c.strip() for c in color.lower().split(',')]
                base_colors_to_find = set()
                for c in colors:
                    base_color = COLOR_SIMPLIFICATION_MAP.get(c.replace(' ', '_'), c)
                    base_colors_to_find.add(base_color)
                
                variants_to_search = {
                    variant for variant, base in COLOR_SIMPLIFICATION_MAP.items()
                    if base in base_colors_to_find
                }
                variants_to_search.update(base_colors_to_find)
                
                if variants_to_search:
                    color_conditions = [
                        {'colors': {'$regex': variant, '$options': 'i'}}
                        for variant in variants_to_search
                    ]
                    query_filters.append({'$or': color_conditions})
            
            # Combine all filters with AND
            mongo_query = {'$and': query_filters} if query_filters else {}
            
            # Count total
            total_count = collection.count_documents(mongo_query)
            
            # Calculate pagination
            skip = (page - 1) * page_size
            
            # Fetch documents
            cursor = collection.find(mongo_query).sort('created_at', -1).skip(skip).limit(page_size)
            docs = list(cursor)
            
            # Convert to serializer format
            results = [PostDocument.from_mongo(doc).to_serializer_dict() for doc in docs]
            
            # Build pagination URLs (matching DRF format)
            has_next = (skip + page_size) < total_count
            has_previous = page > 1
            
            # Generate seed for frontend consistency
            seed = random.randint(1000, 9999)
            
            return {
                'results': results,
                'count': total_count,
                'next': f'?page={page + 1}' if has_next else None,
                'previous': f'?page={page - 1}' if has_previous else None,
                'seed': seed,
            }
        
        except Exception as e:
            logger.error(f"Error filtering posts: {e}")
            return {'results': [], 'count': 0, 'next': None, 'previous': None, 'seed': 0}
    
    def get_all_posts(self, page: int = 1, page_size: int = 48) -> Dict[str, Any]:
        """Get all posts with pagination."""
        return self.filter_posts(page=page, page_size=page_size)
    
    def get_random_posts(self, count: int = 48, exclude_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get random posts using MongoDB $sample."""
        try:
            collection = self.client.get_collection(self.collections_config['posts'])
            
            pipeline = []
            
            # Exclude specific post
            if exclude_id:
                try:
                    obj_id = ObjectId(exclude_id)
                    pipeline.append({'$match': {'_id': {'$ne': obj_id}}})
                except:
                    try:
                        legacy_id = int(exclude_id)
                        pipeline.append({'$match': {'legacy_pg_id': {'$ne': legacy_id}}})
                    except:
                        pass
            
            # Random sample
            pipeline.append({'$sample': {'size': count}})
            
            cursor = collection.aggregate(pipeline)
            docs = list(cursor)
            
            return [PostDocument.from_mongo(doc).to_serializer_dict() for doc in docs]
        
        except Exception as e:
            logger.error(f"Error getting random posts: {e}")
            return []
    
    def get_similar_posts(
        self,
        post_id: str,
        count: int = 48
    ) -> List[Dict[str, Any]]:
        """Get posts similar to a given post (matching shape, pattern, or colors)."""
        try:
            # First get the reference post
            post_data = self.get_post_by_id(post_id)
            if not post_data:
                return self.get_random_posts(count, exclude_id=post_id)
            
            collection = self.client.get_collection(self.collections_config['posts'])
            
            # Build similarity query
            or_conditions = []
            
            if post_data.get('shape'):
                or_conditions.append({'shape': post_data['shape']})
            
            if post_data.get('pattern'):
                or_conditions.append({'pattern': post_data['pattern']})
            
            if post_data.get('colors'):
                for color in post_data['colors']:
                    or_conditions.append({'colors': color})
            
            if not or_conditions:
                return self.get_random_posts(count, exclude_id=post_id)
            
            # Exclude current post
            query = {'$or': or_conditions}
            try:
                obj_id = ObjectId(post_id)
                query['_id'] = {'$ne': obj_id}
            except:
                try:
                    legacy_id = int(post_id)
                    query['legacy_pg_id'] = {'$ne': legacy_id}
                except:
                    pass
            
            # Get similar posts
            cursor = collection.find(query).limit(count * 2)
            docs = cursor.to_list(length=count * 2)
            
            # Shuffle and limit
            random.shuffle(docs)
            docs = docs[:count]
            
            results = [PostDocument.from_mongo(doc).to_serializer_dict() for doc in docs]
            
            # Fill with random if not enough
            if len(results) < count:
                random_posts = self.get_random_posts(count - len(results), exclude_id=post_id)
                results.extend(random_posts)
            
            return results[:count]
        
        except Exception as e:
            logger.error(f"Error getting similar posts: {e}")
            return self.get_random_posts(count, exclude_id=post_id)
    
    def create_post(self, post_data: PostDocument) -> Optional[str]:
        """Create a new post. Returns ObjectId string."""
        try:
            collection = self.client.get_collection(self.collections_config['posts'])
            result = collection.insert_one(post_data.to_dict())
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            return None
    
    # ==================== COLLECTION OPERATIONS ====================
    
    def get_collection_by_id(self, collection_id: str) -> Optional[CollectionDocument]:
        """Get collection by ObjectId or legacy_pg_id."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            # Try ObjectId
            try:
                obj_id = ObjectId(collection_id)
                doc = coll.find_one({'_id': obj_id})
                if doc:
                    return CollectionDocument.from_mongo(doc)
            except:
                pass
            
            # Try legacy_pg_id
            try:
                legacy_id = int(collection_id)
                doc = coll.find_one({'legacy_pg_id': legacy_id})
                if doc:
                    return CollectionDocument.from_mongo(doc)
            except:
                pass
            
            return None
        except Exception as e:
            logger.error(f"Error getting collection {collection_id}: {e}")
            return None
    
    def get_user_collections(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Get all collections for a user with pagination."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            # Count total
            total_count = coll.count_documents({'user_id': user_id})
            
            # Pagination
            skip = (page - 1) * page_size
            cursor = coll.find({'user_id': user_id}).sort('created_at', -1).skip(skip).limit(page_size)
            docs = list(cursor)
            
            # Convert to serializer format with post previews
            results = []
            posts_coll = self.client.get_collection(self.collections_config['posts'])
            
            for doc in docs:
                collection_doc = CollectionDocument.from_mongo(doc)
                post_count = len(collection_doc.post_ids)
                
                # Get first 4 post images for preview
                posts_preview = []
                if collection_doc.post_ids:
                    preview_ids = collection_doc.post_ids[:4]
                    for pid in preview_ids:
                        try:
                            post_doc = posts_coll.find_one({'_id': ObjectId(pid)})
                            if post_doc:
                                posts_preview.append(post_doc.get('image_url', ''))
                        except:
                            pass
                
                results.append(collection_doc.to_serializer_dict(post_count, posts_preview))
            
            return {
                'results': results,
                'count': total_count,
                'next': f'?page={page + 1}' if (skip + page_size) < total_count else None,
                'previous': f'?page={page - 1}' if page > 1 else None,
            }
        
        except Exception as e:
            logger.error(f"Error getting user collections: {e}")
            return {'results': [], 'count': 0, 'next': None, 'previous': None}
    
    def get_collection_posts(
        self,
        collection_id: str,
        page: int = 1,
        page_size: int = 48
    ) -> Dict[str, Any]:
        """Get all posts in a collection with pagination."""
        try:
            collection_doc = self.get_collection_by_id(collection_id)
            if not collection_doc:
                return {'results': [], 'count': 0, 'next': None, 'previous': None}
            
            post_ids = collection_doc.post_ids
            total_count = len(post_ids)
            
            # Pagination
            skip = (page - 1) * page_size
            paginated_ids = post_ids[skip:skip + page_size]
            
            # Fetch posts
            posts_coll = self.client.get_collection(self.collections_config['posts'])
            object_ids = [ObjectId(pid) for pid in paginated_ids if ObjectId.is_valid(pid)]
            
            cursor = posts_coll.find({'_id': {'$in': object_ids}})
            docs = list(cursor)
            
            results = [PostDocument.from_mongo(doc).to_serializer_dict() for doc in docs]
            
            return {
                'results': results,
                'count': total_count,
                'next': f'?page={page + 1}' if (skip + page_size) < total_count else None,
                'previous': f'?page={page - 1}' if page > 1 else None,
            }
        
        except Exception as e:
            logger.error(f"Error getting collection posts: {e}")
            return {'results': [], 'count': 0, 'next': None, 'previous': None}
    
    def create_collection(self, user_id: int, name: str) -> Optional[str]:
        """Create a new collection. Returns ObjectId string."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            # Check for duplicate name
            existing = coll.find_one({'user_id': user_id, 'name': name})
            if existing:
                logger.warning(f"Collection '{name}' already exists for user {user_id}")
                return None
            
            collection_doc = CollectionDocument(user_id=user_id, name=name)
            result = coll.insert_one(collection_doc.to_dict())
            return str(result.inserted_id)
        
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return None
    
    def add_post_to_collection(self, collection_id: str, post_id: str) -> bool:
        """Add a post to a collection using $addToSet."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            # Get collection ObjectId
            try:
                coll_obj_id = ObjectId(collection_id)
            except:
                try:
                    legacy_id = int(collection_id)
                    doc = coll.find_one({'legacy_pg_id': legacy_id})
                    if not doc:
                        return False
                    coll_obj_id = doc['_id']
                except:
                    return False
            
            # Verify post exists
            post_data = self.get_post_by_id(post_id)
            if not post_data:
                return False
            
            # Get actual post ObjectId string
            posts_coll = self.client.get_collection(self.collections_config['posts'])
            try:
                post_obj_id = ObjectId(post_id)
                post_doc = posts_coll.find_one({'_id': post_obj_id})
            except:
                try:
                    legacy_id = int(post_id)
                    post_doc = posts_coll.find_one({'legacy_pg_id': legacy_id})
                except:
                    return False
            
            if not post_doc:
                return False
            
            post_id_str = str(post_doc['_id'])
            
            # Add to collection (addToSet prevents duplicates)
            result = coll.update_one(
                {'_id': coll_obj_id},
                {'$addToSet': {'post_ids': post_id_str}}
            )
            
            return result.modified_count > 0 or result.matched_count > 0
        
        except Exception as e:
            logger.error(f"Error adding post to collection: {e}")
            return False
    
    def remove_post_from_collection(self, collection_id: str, post_id: str) -> bool:
        """Remove a post from a collection using $pull."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            # Get collection ObjectId
            try:
                coll_obj_id = ObjectId(collection_id)
            except:
                try:
                    legacy_id = int(collection_id)
                    doc = coll.find_one({'legacy_pg_id': legacy_id})
                    if not doc:
                        return False
                    coll_obj_id = doc['_id']
                except:
                    return False
            
            # Get post ObjectId string
            posts_coll = self.client.get_collection(self.collections_config['posts'])
            try:
                post_obj_id = ObjectId(post_id)
                post_doc = posts_coll.find_one({'_id': post_obj_id})
            except:
                try:
                    legacy_id = int(post_id)
                    post_doc = posts_coll.find_one({'legacy_pg_id': legacy_id})
                except:
                    return False
            
            if not post_doc:
                return False
            
            post_id_str = str(post_doc['_id'])
            
            # Remove from collection
            result = coll.update_one(
                {'_id': coll_obj_id},
                {'$pull': {'post_ids': post_id_str}}
            )
            
            return result.modified_count > 0
        
        except Exception as e:
            logger.error(f"Error removing post from collection: {e}")
            return False
    
    def delete_collection(self, collection_id: str) -> bool:
        """Delete a collection."""
        try:
            coll = self.client.get_collection(self.collections_config['collections'])
            
            try:
                obj_id = ObjectId(collection_id)
                result = coll.delete_one({'_id': obj_id})
            except:
                try:
                    legacy_id = int(collection_id)
                    result = coll.delete_one({'legacy_pg_id': legacy_id})
                except:
                    return False
            
            return result.deleted_count > 0
        
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False
    
    # ==================== TRYON OPERATIONS ====================
    
    def create_tryon(self, user_id: int, post_id: str) -> Optional[str]:
        """Create a TryOn record. Returns ObjectId string."""
        try:
            coll = self.client.get_collection(self.collections_config['tryons'])
            
            # Get post ObjectId string
            posts_coll = self.client.get_collection(self.collections_config['posts'])
            try:
                post_obj_id = ObjectId(post_id)
                post_doc = posts_coll.find_one({'_id': post_obj_id})
            except:
                try:
                    legacy_id = int(post_id)
                    post_doc = posts_coll.find_one({'legacy_pg_id': legacy_id})
                except:
                    return None
            
            if not post_doc:
                return None
            
            post_id_str = str(post_doc['_id'])
            
            # Check if already exists
            existing = coll.find_one({'user_id': user_id, 'post_id': post_id_str})
            if existing:
                return str(existing['_id'])
            
            # Create new TryOn
            tryon_doc = TryOnDocument(user_id=user_id, post_id=post_id_str)
            result = coll.insert_one(tryon_doc.to_dict())
            return str(result.inserted_id)
        
        except Exception as e:
            logger.error(f"Error creating tryon: {e}")
            return None
    
    def get_user_tryons(self, user_id: int, page: int = 1, page_size: int = 48) -> Dict[str, Any]:
        """Get all TryOns for a user with pagination."""
        try:
            tryons_coll = self.client.get_collection(self.collections_config['tryons'])
            
            # Count total
            total_count = tryons_coll.count_documents({'user_id': user_id})
            
            # Pagination
            skip = (page - 1) * page_size
            cursor = tryons_coll.find({'user_id': user_id}).sort('created_at', -1).skip(skip).limit(page_size)
            docs = list(cursor)
            
            # Convert with nested post data
            results = []
            for doc in docs:
                tryon_doc = TryOnDocument.from_mongo(doc)
                post_data = self.get_post_by_id(tryon_doc.post_id)
                results.append(tryon_doc.to_serializer_dict(post_data))
            
            return {
                'results': results,
                'count': total_count,
                'next': f'?page={page + 1}' if (skip + page_size) < total_count else None,
                'previous': f'?page={page - 1}' if page > 1 else None,
            }
        
        except Exception as e:
            logger.error(f"Error getting user tryons: {e}")
            return {'results': [], 'count': 0, 'next': None, 'previous': None}
    
    def delete_tryon(self, tryon_id: str) -> bool:
        """Delete a TryOn record."""
        try:
            coll = self.client.get_collection(self.collections_config['tryons'])
            
            try:
                obj_id = ObjectId(tryon_id)
                result = coll.delete_one({'_id': obj_id})
            except:
                try:
                    legacy_id = int(tryon_id)
                    result = coll.delete_one({'legacy_pg_id': legacy_id})
                except:
                    return False
            
            return result.deleted_count > 0
        
        except Exception as e:
            logger.error(f"Error deleting tryon: {e}")
            return False
    
    # ==================== USER CLEANUP ====================
    
    def delete_user_data(self, user_id: int) -> bool:
        """Delete all collections and tryons for a user."""
        try:
            collections_coll = self.client.get_collection(self.collections_config['collections'])
            tryons_coll = self.client.get_collection(self.collections_config['tryons'])
            
            collections_coll.delete_many({'user_id': user_id})
            tryons_coll.delete_many({'user_id': user_id})
            
            return True
        
        except Exception as e:
            logger.error(f"Error deleting user data: {e}")
            return False


    # ==================== NAIL SEARCH MICROSERVICE OPERATIONS ====================
    
    def create_post_from_classification(
        self,
        image_url: str,
        classification: Dict[str, Any],
        width: int = 640,
        height: int = 800,
        title: Optional[str] = None,
        embedding_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Create a new post in MongoDB from classification results.
        
        Args:
            image_url: URL to the nail image
            classification: Dict with pattern, shape, size, colors from microservice
            width: Image width
            height: Image height
            title: Optional post title
            embedding_id: Optional UUID from microservice for vector search
        
        Returns:
            Post ObjectId string if successful, None otherwise
        """
        try:
            collection = self.client.get_collection(self.collections_config['posts'])
            
            # Build title from classification if not provided
            if not title:
                colors_str = ', '.join(classification.get('colors', [])[:2])
                shape = classification.get('shape', 'nail').capitalize()
                pattern = classification.get('pattern', '').capitalize()
                title = f"{colors_str} {shape} {pattern}".strip()
            
            # Create PostDocument
            post = PostDocument(
                title=title,
                image_url=image_url,
                width=width,
                height=height,
                shape=classification.get('shape', ''),
                pattern=classification.get('pattern', ''),
                size=classification.get('size', ''),
                colors=classification.get('colors', []),
                embedding_id=embedding_id,
                classified_at=datetime.utcnow(),
                classification_confidence=1.0  # Full confidence from microservice
            )
            
            result = collection.insert_one(post.to_dict())
            logger.info(f"Created post from classification: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error creating post from classification: {e}")
            return None
    
    def search_with_fallback(
        self,
        q: Optional[str] = None,
        shape: Optional[str] = None,
        pattern: Optional[str] = None,
        size: Optional[str] = None,
        color: Optional[str] = None,
        page: int = 1,
        page_size: int = 48,
        extracted_keywords: Optional[Dict] = None,
        remaining_query: Optional[str] = None,
        fallback_threshold: int = 10
    ) -> Dict[str, Any]:
        """
        Search posts with automatic fallback to similar search if results < threshold.
        
        This implements the intelligent search flow:
        1. Perform text-based search
        2. If results < fallback_threshold (default 10), trigger similar search
        3. Extract attributes from first result
        4. Query nail search microservice for similar nails
        5. Merge and return combined results
        
        Args:
            Same as filter_posts plus:
            fallback_threshold: Minimum results before triggering fallback (default: 10)
        
        Returns:
            Dict with: results, count, next, previous, seed, fallback_triggered (bool)
        """
        try:
            # First, perform regular text-based search
            initial_results = self.filter_posts(
                q=q,
                shape=shape,
                pattern=pattern,
                size=size,
                color=color,
                page=page,
                page_size=page_size,
                extracted_keywords=extracted_keywords,
                remaining_query=remaining_query
            )
            
            result_count = len(initial_results.get('results', []))
            
            # Check if fallback is needed
            if result_count >= fallback_threshold or result_count == 0:
                initial_results['fallback_triggered'] = False
                return initial_results
            
            # Fallback: Get similar nails
            logger.info(f"Triggering fallback search (found {result_count} < {fallback_threshold})")
            
            # Use first result as reference for similarity search
            first_result = initial_results['results'][0]
            reference_id = first_result.get('id')
            
            # Get reference post attributes for microservice
            reference_attrs = {
                'pattern': first_result.get('pattern', ''),
                'shape': first_result.get('shape', ''),
                'size': first_result.get('size', ''),
                'colors': first_result.get('colors', [])
            }
            
            # Query nail search microservice
            nail_client = get_nail_search_client()
            
            # Check if service is available
            if not nail_client.health_check():
                logger.warning("Nail search microservice unavailable, returning text search results")
                initial_results['fallback_triggered'] = False
                initial_results['fallback_error'] = 'Microservice unavailable'
                return initial_results
            
            # Try to find similar nails by ID (if microservice has this image)
            similar_results = nail_client.find_similar(
                nail_id=reference_id,
                limit=page_size - result_count,  # Fill remaining slots
                threshold=0.7,
                match_fields=2
            )
            
            if not similar_results or not similar_results.get('success'):
                # Fallback failed, return original results
                logger.warning("Similarity search failed, returning text search results")
                initial_results['fallback_triggered'] = False
                return initial_results
            
            # Merge results
            similar_nails = similar_results.get('similarNails', [])
            logger.info(f"Found {len(similar_nails)} similar nails from microservice")
            
            # Fetch these nails from MongoDB (if they exist)
            additional_results = []
            for nail in similar_nails:
                nail_id = nail.get('id')
                post = self.get_post_by_id(nail_id)
                if post:
                    additional_results.append(post)
            
            # Combine results (remove duplicates)
            existing_ids = {r.get('id') for r in initial_results['results']}
            unique_additional = [r for r in additional_results if r.get('id') not in existing_ids]
            
            combined_results = initial_results['results'] + unique_additional[:page_size - result_count]
            
            return {
                'results': combined_results,
                'count': initial_results['count'] + len(unique_additional),
                'next': initial_results.get('next'),
                'previous': initial_results.get('previous'),
                'seed': initial_results.get('seed'),
                'fallback_triggered': True,
                'fallback_added': len(unique_additional)
            }
            
        except Exception as e:
            logger.error(f"Error in search_with_fallback: {e}")
            # Return original text search results on error
            fallback_results = self.filter_posts(
                q=q, shape=shape, pattern=pattern, size=size, color=color,
                page=page, page_size=page_size,
                extracted_keywords=extracted_keywords,
                remaining_query=remaining_query
            )
            fallback_results['fallback_triggered'] = False
            fallback_results['fallback_error'] = str(e)
            return fallback_results
    
    def classify_and_search(
        self,
        image_url: str,
        page: int = 1,
        page_size: int = 48
    ) -> Dict[str, Any]:
        """
        Classify a new nail image and search for similar results.
        
        This is used when a user uploads a new image that doesn't exist in our database.
        
        Flow:
        1. Call microservice to classify the image
        2. Extract pattern, shape, size, colors
        3. Perform text-based search with extracted attributes
        4. Optionally save the classified image to MongoDB
        
        Args:
            image_url: URL to the nail image to classify
            page: Page number
            page_size: Results per page
        
        Returns:
            Dict with: results, count, classification, image_url
        """
        try:
            nail_client = get_nail_search_client()
            
            # Check if service is available
            if not nail_client.health_check():
                logger.error("Nail search microservice unavailable for classification")
                return {
                    'results': [],
                    'count': 0,
                    'error': 'Classification service unavailable',
                    'success': False
                }
            
            # Classify the image
            classification_result = nail_client.classify_nail_image(image_url=image_url)
            
            if not classification_result or not classification_result.get('success'):
                logger.error("Image classification failed")
                return {
                    'results': [],
                    'count': 0,
                    'error': 'Classification failed',
                    'success': False
                }
            
            classification = classification_result.get('classification', {})
            logger.info(f"Successfully classified image: {classification}")
            
            # Save to MongoDB (optional - create the post)
            post_id = self.create_post_from_classification(
                image_url=image_url,
                classification=classification,
                embedding_id=None  # Could be returned by microservice
            )
            
            # Search with extracted attributes
            search_results = self.filter_posts(
                shape=classification.get('shape'),
                pattern=classification.get('pattern'),
                size=classification.get('size'),
                color=','.join(classification.get('colors', [])),
                page=page,
                page_size=page_size
            )
            
            # Add classification metadata to response
            search_results['classification'] = classification
            search_results['classified_image_url'] = image_url
            search_results['classified_post_id'] = post_id
            search_results['success'] = True
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error in classify_and_search: {e}")
            return {
                'results': [],
                'count': 0,
                'error': str(e),
                'success': False
            }


# Singleton instance
_mongo_manager = None


def get_mongo_manager() -> MongoDBManager:
    """Get or create MongoDB manager singleton."""
    global _mongo_manager
    if _mongo_manager is None:
        _mongo_manager = MongoDBManager()
    return _mongo_manager

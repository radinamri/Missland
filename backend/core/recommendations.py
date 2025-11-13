"""
Advanced Recommendation Engine for Missland
Implements collaborative filtering, content-based filtering, and hybrid recommendations
"""

from django.db.models import Count, Q, F
from django.core.cache import cache
from collections import Counter, defaultdict
import math
from typing import List, Dict, Tuple
from .models import Post, User, Collection, TryOn, InterestProfile


class RecommendationEngine:
    """
    Hybrid recommendation system combining multiple strategies:
    1. Content-based filtering (based on post attributes)
    2. Collaborative filtering (based on user behavior)
    3. Popularity-based recommendations
    4. Interest decay over time
    """

    @staticmethod
    def get_personalized_feed(user: User, limit: int = 100) -> List[Post]:
        """
        Get personalized feed for a user using hybrid recommendations
        
        Args:
            user: User object
            limit: Number of posts to return
            
        Returns:
            List of recommended Post objects
        """
        cache_key = f"recommendations:user:{user.id}:feed:{limit}"
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            return cached_result
        
        try:
            profile = user.interest_profile
            
            # Get user's interest scores with decay
            tag_scores = RecommendationEngine._apply_interest_decay(profile.tag_scores)
            
            if not tag_scores:
                # New user - return trending posts
                result = RecommendationEngine._get_trending_posts(limit)
                cache.set(cache_key, result, timeout=300)
                return result
            
            # Score all posts based on multiple factors
            scored_posts = []
            all_posts = Post.objects.select_related().only(
                'id', 'title', 'shape', 'pattern', 'size', 'colors',
                'views_count', 'saves_count', 'created_at'
            )
            
            for post in all_posts:
                score = RecommendationEngine._calculate_post_score(
                    post, tag_scores, user
                )
                if score > 0:
                    scored_posts.append((post, score))
            
            # Sort by score and return top posts
            scored_posts.sort(key=lambda x: x[1], reverse=True)
            result = [post for post, score in scored_posts[:limit]]
            
            cache.set(cache_key, result, timeout=300)  # Cache for 5 minutes
            return result
            
        except (InterestProfile.DoesNotExist, AttributeError):
            # Fallback to trending posts
            result = RecommendationEngine._get_trending_posts(limit)
            cache.set(cache_key, result, timeout=300)
            return result

    @staticmethod
    def _calculate_post_score(post: Post, tag_scores: Dict, user: User) -> float:
        """
        Calculate relevance score for a post based on multiple factors
        
        Scoring components:
        1. Interest match (40%)
        2. Popularity (30%)
        3. Freshness (20%)
        4. Diversity (10%)
        """
        score = 0.0
        
        # 1. Interest-based scoring (40% weight)
        interest_score = 0
        post_tags = []
        
        if post.shape:
            post_tags.append(post.shape)
            interest_score += tag_scores.get(post.shape, 0) * 2.0  # Shape is important
        
        if post.pattern:
            post_tags.append(post.pattern)
            interest_score += tag_scores.get(post.pattern, 0) * 1.5  # Pattern moderately important
        
        if post.size:
            post_tags.append(post.size)
            interest_score += tag_scores.get(post.size, 0) * 1.0
        
        if post.colors:
            for color in post.colors[:3]:  # Limit to top 3 colors
                post_tags.append(color)
                interest_score += tag_scores.get(color, 0) * 0.8
        
        score += interest_score * 0.4
        
        # 2. Popularity-based scoring (30% weight)
        # Normalize views and saves
        popularity_score = (
            math.log1p(post.views_count) * 0.3 +
            math.log1p(post.saves_count) * 0.7  # Saves are more valuable
        )
        score += popularity_score * 0.3
        
        # 3. Freshness scoring (20% weight)
        # Newer posts get a boost
        from django.utils import timezone
        import datetime
        
        age_days = (timezone.now() - post.created_at).days
        freshness_score = max(0, 10 - age_days * 0.1)  # Decay over 100 days
        score += freshness_score * 0.2
        
        # 4. Diversity bonus (10% weight)
        # Slightly boost posts that differ from user's usual preferences
        diversity_score = 0
        uncommon_tags = [tag for tag in post_tags if tag_scores.get(tag, 0) < 2]
        if uncommon_tags:
            diversity_score = len(uncommon_tags) * 0.5
        score += diversity_score * 0.1
        
        return score

    @staticmethod
    def _apply_interest_decay(tag_scores: Dict, decay_rate: float = 0.95) -> Dict:
        """
        Apply exponential decay to old interests to keep recommendations fresh
        
        Args:
            tag_scores: Dictionary of tag scores
            decay_rate: Rate of decay (0.95 = 5% decay per period)
            
        Returns:
            Dictionary with decayed scores
        """
        # In a real implementation, you'd track timestamps for each interest
        # For now, apply a simple decay to all scores
        decayed_scores = {}
        for tag, score in tag_scores.items():
            if score > 0.5:  # Only keep significant interests
                decayed_scores[tag] = score * decay_rate
        
        return decayed_scores

    @staticmethod
    def _get_trending_posts(limit: int = 100) -> List[Post]:
        """
        Get trending posts based on recent engagement
        
        Args:
            limit: Number of posts to return
            
        Returns:
            List of trending Post objects
        """
        from django.utils import timezone
        import datetime
        
        # Get posts from last 30 days, sorted by engagement
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        
        trending = Post.objects.filter(
            created_at__gte=thirty_days_ago
        ).annotate(
            engagement_score=F('views_count') + F('saves_count') * 3
        ).order_by('-engagement_score')[:limit]
        
        return list(trending)

    @staticmethod
    def get_similar_posts(post: Post, limit: int = 48) -> List[Post]:
        """
        Get posts similar to a given post using content-based filtering
        
        Args:
            post: Reference post
            limit: Number of similar posts to return
            
        Returns:
            List of similar Post objects
        """
        cache_key = f"similar:post:{post.id}:limit:{limit}"
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            return cached_result
        
        # Build query for similar posts
        q_objects = Q()
        
        if post.shape:
            q_objects |= Q(shape=post.shape)
        
        if post.pattern:
            q_objects |= Q(pattern=post.pattern)
        
        if post.size:
            q_objects |= Q(size=post.size)
        
        if post.colors:
            for color in post.colors:
                q_objects |= Q(colors__contains=color)
        
        # Get similar posts, exclude the original
        similar_posts = Post.objects.filter(q_objects).exclude(
            id=post.id
        ).distinct().annotate(
            engagement=F('views_count') + F('saves_count') * 2
        ).order_by('-engagement')[:limit * 2]  # Get extra for scoring
        
        # Score based on attribute overlap
        scored_posts = []
        for similar_post in similar_posts:
            similarity_score = RecommendationEngine._calculate_similarity(
                post, similar_post
            )
            scored_posts.append((similar_post, similarity_score))
        
        # Sort by similarity and return top posts
        scored_posts.sort(key=lambda x: x[1], reverse=True)
        result = [p for p, score in scored_posts[:limit]]
        
        cache.set(cache_key, result, timeout=600)  # Cache for 10 minutes
        return result

    @staticmethod
    def _calculate_similarity(post1: Post, post2: Post) -> float:
        """Calculate similarity score between two posts"""
        score = 0.0
        
        # Exact matches
        if post1.shape == post2.shape:
            score += 3.0
        if post1.pattern == post2.pattern:
            score += 2.5
        if post1.size == post2.size:
            score += 1.5
        
        # Color overlap
        if post1.colors and post2.colors:
            common_colors = set(post1.colors) & set(post2.colors)
            score += len(common_colors) * 1.0
        
        return score

    @staticmethod
    def get_collaborative_recommendations(user: User, limit: int = 50) -> List[Post]:
        """
        Get recommendations based on similar users' preferences (collaborative filtering)
        
        Args:
            user: User object
            limit: Number of posts to return
            
        Returns:
            List of recommended Post objects
        """
        cache_key = f"collaborative:user:{user.id}:limit:{limit}"
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            return cached_result
        
        # Get user's saved posts
        user_saved_post_ids = set(
            Collection.objects.filter(user=user).values_list('posts__id', flat=True)
        )
        
        if not user_saved_post_ids:
            return []
        
        # Find users with similar saves
        similar_users = User.objects.filter(
            collections__posts__id__in=user_saved_post_ids
        ).exclude(id=user.id).annotate(
            common_posts=Count('collections__posts')
        ).filter(common_posts__gte=2).order_by('-common_posts')[:20]
        
        # Get posts saved by similar users that current user hasn't saved
        recommended_post_ids = Collection.objects.filter(
            user__in=similar_users
        ).exclude(
            posts__id__in=user_saved_post_ids
        ).values_list('posts__id', flat=True).distinct()
        
        # Get the actual posts with engagement scores
        recommended_posts = Post.objects.filter(
            id__in=recommended_post_ids
        ).annotate(
            engagement=F('saves_count') * 2 + F('views_count')
        ).order_by('-engagement')[:limit]
        
        result = list(recommended_posts)
        cache.set(cache_key, result, timeout=600)
        return result

    @staticmethod
    def update_user_interests(user: User, post: Post, interaction_type: str):
        """
        Update user's interest profile based on interaction
        
        Args:
            user: User object
            post: Post object that was interacted with
            interaction_type: 'view', 'save', 'try_on'
        """
        profile, created = InterestProfile.objects.get_or_create(user=user)
        
        # Weight different interactions differently
        weights = {
            'view': 0.1,
            'save': 1.5,
            'try_on': 2.0,
            'search': 0.5
        }
        
        weight = weights.get(interaction_type, 0.1)
        
        # Update interest scores
        if post.shape:
            profile.tag_scores[post.shape] = profile.tag_scores.get(post.shape, 0) + weight * 2.0
        
        if post.pattern:
            profile.tag_scores[post.pattern] = profile.tag_scores.get(post.pattern, 0) + weight * 1.5
        
        if post.size:
            profile.tag_scores[post.size] = profile.tag_scores.get(post.size, 0) + weight * 1.0
        
        if post.colors:
            for color in post.colors:
                profile.tag_scores[color] = profile.tag_scores.get(color, 0) + weight * 0.8
        
        profile.save()
        
        # Invalidate cache
        cache.delete(f"recommendations:user:{user.id}:*")
        cache.delete(f"collaborative:user:{user.id}:*")

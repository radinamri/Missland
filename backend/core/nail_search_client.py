"""
HTTP client for interacting with the Nail Search Microservice.
Handles classification, text-based search, and similarity search.
"""

import requests
import logging
from typing import Dict, List, Optional, Any, Union
from io import BytesIO
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from django.conf import settings

logger = logging.getLogger(__name__)


class NailSearchClient:
    """Client for the Nail Search AI Microservice."""
    
    def __init__(self):
        """Initialize the client with connection pooling and retry logic."""
        self.base_url = getattr(settings, 'NAIL_SEARCH_API_URL', 'http://localhost:3000')
        self.api_key = getattr(settings, 'NAIL_SEARCH_API_KEY', None)
        self.timeout_classify = 30  # Classification can take longer
        self.timeout_search = 15    # Search should be faster
        
        # Create session with connection pooling
        self.session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=10,
            pool_maxsize=20
        )
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        if self.api_key:
            self.session.headers.update({'X-API-Key': self.api_key})
    
    def _build_url(self, endpoint: str) -> str:
        """Build full URL for an endpoint."""
        return f"{self.base_url}{endpoint}"
    
    def _handle_response(self, response: requests.Response, operation: str) -> Dict[str, Any]:
        """Handle API response and errors."""
        try:
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success', False):
                logger.warning(f"Nail search API returned success=false for {operation}: {data}")
            
            return data
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error during {operation}: {e}")
            logger.error(f"Response content: {response.text}")
            raise
        except requests.exceptions.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response for {operation}: {e}")
            logger.error(f"Response content: {response.text}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during {operation}: {e}")
            raise
    
    def classify_nail_image(
        self,
        image: Optional[BytesIO] = None,
        image_url: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Classify a nail image to extract pattern, shape, size, and colors.
        
        Args:
            image: Binary image data (BytesIO or file-like object)
            image_url: URL to the image (alternative to binary data)
        
        Returns:
            Dict with classification results:
            {
                "success": true,
                "classification": {
                    "pattern": "gradient",
                    "shape": "coffin",
                    "size": "medium",
                    "colors": ["pink", "white", "purple"]
                },
                "timestamp": "2025-10-21T14:32:45Z"
            }
        
        Raises:
            ValueError: If neither image nor image_url provided
            requests.exceptions.RequestException: On API errors
        """
        if not image and not image_url:
            raise ValueError("Either 'image' or 'image_url' must be provided")
        
        endpoint = "/api/nails/classify"
        url = self._build_url(endpoint)
        
        try:
            if image:
                # Send binary image data
                files = {'image': ('nail.jpg', image, 'image/jpeg')}
                response = self.session.post(
                    url,
                    files=files,
                    timeout=self.timeout_classify
                )
            else:
                # Send image URL
                data = {'imageUrl': image_url}
                response = self.session.post(
                    url,
                    json=data,
                    timeout=self.timeout_classify
                )
            
            result = self._handle_response(response, 'classify_nail_image')
            logger.info(f"Successfully classified nail image: {result.get('classification')}")
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"Classification request timed out after {self.timeout_classify}s")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"Failed to connect to nail search service at {self.base_url}")
            return None
        except Exception as e:
            logger.error(f"Failed to classify nail image: {e}")
            return None
    
    def text_search(
        self,
        pattern: Optional[str] = None,
        shape: Optional[str] = None,
        size: Optional[str] = None,
        colors: Optional[List[str]] = None,
        limit: int = 20,
        page: int = 1
    ) -> Optional[Dict[str, Any]]:
        """
        Search nails using text-based parameters.
        
        Args:
            pattern: Nail pattern (glossy, gradient, mixed, french_tips, matte)
            shape: Nail shape (square, almond, stiletto, coffin)
            size: Nail size (small, medium, large)
            colors: List of colors to filter by
            limit: Number of results to return (default: 20, max: 100)
            page: Page number for pagination
        
        Returns:
            Dict with search results:
            {
                "success": true,
                "query": {...},
                "nails": [...],
                "total": 156,
                "page": 1,
                "pageSize": 20,
                "totalPages": 8
            }
        """
        endpoint = "/api/nails/search"
        url = self._build_url(endpoint)
        
        # Build query parameters
        params = {}
        if pattern:
            params['pattern'] = pattern
        if shape:
            params['shape'] = shape
        if size:
            params['size'] = size
        if colors:
            params['colors'] = ','.join(colors)
        params['limit'] = min(limit, 100)
        params['page'] = page
        
        try:
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout_search
            )
            
            result = self._handle_response(response, 'text_search')
            logger.info(f"Text search returned {len(result.get('nails', []))} results")
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"Text search request timed out after {self.timeout_search}s")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"Failed to connect to nail search service at {self.base_url}")
            return None
        except Exception as e:
            logger.error(f"Failed to execute text search: {e}")
            return None
    
    def find_similar(
        self,
        image: Optional[BytesIO] = None,
        nail_id: Optional[str] = None,
        limit: int = 10,
        threshold: float = 0.7,
        exclude_ids: Optional[List[str]] = None,
        match_fields: int = 2
    ) -> Optional[Dict[str, Any]]:
        """
        Find similar nails by image or nail ID.
        
        Args:
            image: Binary image data (BytesIO or file-like object)
            nail_id: ID of a nail in the database
            limit: Number of similar results to return (default: 5, max: 10)
            threshold: Minimum similarity threshold (0-1)
            exclude_ids: List of nail IDs to exclude from results
            match_fields: Minimum classification fields that must match
        
        Returns:
            Dict with similar nails:
            {
                "success": true,
                "searchType": "image",
                "inputAnalysis": {...},
                "reference": {...},
                "similarNails": [...],
                "total": 10
            }
        
        Raises:
            ValueError: If neither image nor nail_id provided
        """
        if not image and not nail_id:
            raise ValueError("Either 'image' or 'id' must be provided")
        
        endpoint = "/api/nails/search/similar"
        url = self._build_url(endpoint)
        
        try:
            if image:
                # Send binary image with form data for other parameters
                files = {'image': ('nail.jpg', image, 'image/jpeg')}
                data = {
                    'limit': min(limit, 10),
                    'threshold': threshold,
                    'matchFields': match_fields
                }
                if exclude_ids:
                    data['excludeIds'] = ','.join(exclude_ids)
                
                response = self.session.post(
                    url,
                    files=files,
                    data=data,
                    timeout=self.timeout_search
                )
            else:
                # Send JSON with nail ID
                payload = {
                    'id': nail_id,
                    'limit': min(limit, 10),
                    'threshold': threshold,
                    'matchFields': match_fields
                }
                if exclude_ids:
                    payload['excludeIds'] = exclude_ids
                
                response = self.session.post(
                    url,
                    json=payload,
                    timeout=self.timeout_search
                )
            
            result = self._handle_response(response, 'find_similar')
            logger.info(f"Similarity search returned {len(result.get('similarNails', []))} results")
            return result
            
        except requests.exceptions.Timeout:
            logger.error(f"Similarity search request timed out after {self.timeout_search}s")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"Failed to connect to nail search service at {self.base_url}")
            return None
        except Exception as e:
            logger.error(f"Failed to execute similarity search: {e}")
            return None
    
    def health_check(self) -> bool:
        """
        Check if the nail search service is available.
        
        Returns:
            bool: True if service is healthy, False otherwise
        """
        try:
            # Try a simple GET request to the base URL or health endpoint
            response = self.session.get(
                self.base_url,
                timeout=5
            )
            return response.status_code < 500
        except Exception as e:
            logger.warning(f"Nail search service health check failed: {e}")
            return False


# Global singleton instance
_client = None


def get_nail_search_client() -> NailSearchClient:
    """Get or create the global NailSearchClient instance."""
    global _client
    if _client is None:
        _client = NailSearchClient()
    return _client

"""
Weaviate v4 AsyncClient singleton for connection management
"""
from typing import Optional
from weaviate import WeaviateAsyncClient, connect_to_local
from weaviate.auth import AuthApiKey
from app.config import settings
from app.logger import get_logger

logger = get_logger("weaviate_client")


class WeaviateClientFactory:
    """
    Singleton factory for creating and managing Weaviate AsyncClient.
    
    This factory ensures that:
    - Weaviate clients are created with consistent configuration
    - API key is properly loaded from settings
    - Client instances can be reused
    - Connection health is monitored
    """
    
    _instance: Optional['WeaviateClientFactory'] = None
    _client: Optional[WeaviateAsyncClient] = None
    
    def __new__(cls) -> 'WeaviateClientFactory':
        """Implement singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_client(self) -> WeaviateAsyncClient:
        """
        Get or create a WeaviateAsyncClient instance.
        
        Returns:
            WeaviateAsyncClient: Configured Weaviate client
            
        Raises:
            ValueError: If Weaviate connection settings are invalid
        """
        if self._client is None:
            self._client = self._create_client()
        
        # Ensure client is connected (for Weaviate v4)
        if not self._client.is_connected():
            import asyncio
            try:
                # Try to connect if we're in an async context
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # If loop is running, schedule connection
                    asyncio.create_task(self._client.connect())
                else:
                    # If loop is not running, connect synchronously
                    loop.run_until_complete(self._client.connect())
            except RuntimeError:
                # No event loop, connection will happen on first async call
                pass
        
        return self._client
    
    def _create_client(self) -> WeaviateAsyncClient:
        """
        Create a new WeaviateAsyncClient with proper configuration.
        
        Returns:
            WeaviateAsyncClient: Configured client
            
        Raises:
            ValueError: If connection settings are invalid
        """
        try:
            # Build additional headers for OpenAI API key
            additional_headers = {}
            if settings.OPENAI_API_KEY:
                additional_headers["X-OpenAI-Api-Key"] = settings.OPENAI_API_KEY
            
            # Build auth credentials if API key provided
            auth_credentials = None
            if settings.WEAVIATE_API_KEY:
                auth_credentials = AuthApiKey(api_key=settings.WEAVIATE_API_KEY)
            
            # Use connect_to_local for localhost/127.0.0.1, otherwise use ConnectionParams
            if settings.WEAVIATE_HOST in ["localhost", "127.0.0.1"]:
                client = connect_to_local(
                    port=settings.WEAVIATE_PORT,
                    grpc_port=50051,
                    headers=additional_headers if additional_headers else None,
                    auth_credentials=auth_credentials
                )
            else:
                # For Docker or remote Weaviate, use ConnectionParams.from_params() class method
                from weaviate.connect import ConnectionParams
                
                connection_params = ConnectionParams.from_params(
                    http_host=settings.WEAVIATE_HOST,
                    http_port=settings.WEAVIATE_PORT,
                    http_secure=(settings.WEAVIATE_SCHEME == "https"),
                    grpc_host=settings.WEAVIATE_HOST,
                    grpc_port=50051,
                    grpc_secure=(settings.WEAVIATE_SCHEME == "https")
                )
                
                client = WeaviateAsyncClient(
                    connection_params=connection_params,
                    auth_client_secret=auth_credentials,
                    additional_headers=additional_headers if additional_headers else None
                )
            
            logger.info(f"✅ Weaviate client created successfully: {settings.WEAVIATE_HOST}:{settings.WEAVIATE_PORT}")
            return client
            
        except Exception as e:
            logger.error(f"❌ Failed to create Weaviate client: {e}")
            raise
    
    async def health_check(self) -> bool:
        """
        Check Weaviate connection health.
        
        Returns:
            bool: True if healthy, False otherwise
        """
        try:
            client = self.get_client()
            
            # Connect if not already connected
            if not client.is_connected():
                await client.connect()
            
            # is_ready() is synchronous in Weaviate v4
            is_ready = client.is_ready()
            
            if is_ready:
                logger.info("✅ Weaviate health check passed")
            else:
                logger.warning("⚠️ Weaviate health check failed: not ready")
            
            return is_ready
            
        except Exception as e:
            logger.error(f"❌ Weaviate health check error: {e}")
            return False
    
    async def close(self) -> None:
        """Close the Weaviate client connection."""
        if self._client:
            try:
                await self._client.close()
                logger.info("✅ Weaviate client closed")
            except Exception as e:
                logger.error(f"❌ Error closing Weaviate client: {e}")
            finally:
                self._client = None
    
    def reset_client(self) -> None:
        """
        Reset the singleton client instance.
        
        This will force creation of a new client on the next get_client() call.
        """
        self._client = None
        logger.info("🔄 Weaviate client instance reset")


# Singleton instance
_factory = WeaviateClientFactory()


def get_weaviate_client() -> WeaviateAsyncClient:
    """
    Get the shared WeaviateAsyncClient instance.
    
    This is the main entry point for getting a Weaviate client throughout the application.
    
    Returns:
        WeaviateAsyncClient: Configured Weaviate client
        
    Example:
        ```python
        from app.models.weaviate_client import get_weaviate_client
        
        async def my_function():
            client = get_weaviate_client()
            collections = await client.collections.list_all()
        ```
    """
    return _factory.get_client()


async def check_weaviate_health() -> bool:
    """
    Check Weaviate connection health.
    
    Returns:
        bool: True if healthy, False otherwise
    """
    return await _factory.health_check()


async def close_weaviate_client() -> None:
    """Close the Weaviate client connection."""
    await _factory.close()


def reset_weaviate_client() -> None:
    """Reset the shared Weaviate client instance."""
    _factory.reset_client()


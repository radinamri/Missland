"""
MongoDB client singleton using PyMongo for sync operations.
Configured with write concern for data durability.
"""
import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo import WriteConcern
from django.conf import settings

logger = logging.getLogger(__name__)


class MongoDBClient:
    """Singleton MongoDB client with PyMongo sync driver."""
    
    _instance: Optional['MongoDBClient'] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize MongoDB client with write concern."""
        if self._client is None:
            self._initialize_client()
    
    def _initialize_client(self):
        """Create PyMongo client with proper configuration."""
        try:
            mongodb_settings = settings.MONGODB_SETTINGS
            
            # Create PyMongo client with write concern for durability
            # w=1: acknowledge from primary, j=True: wait for journal write
            write_concern = WriteConcern(w=1, j=True, wtimeout=5000)
            
            self._client = MongoClient(
                mongodb_settings['uri'],
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
            )
            
            # Get database with write concern
            db_name = mongodb_settings['database']
            self._db = self._client.get_database(
                db_name,
                write_concern=write_concern
            )
            
            logger.info(f"MongoDB client initialized: {db_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")
            raise
    
    @property
    def client(self) -> MongoClient:
        """Get PyMongo client instance."""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    @property
    def db(self) -> Database:
        """Get database instance with write concern."""
        if self._db is None:
            self._initialize_client()
        return self._db
    
    def get_database(self, database_name: str = None):
        """Get database by name or use default."""
        if database_name:
            return self.client[database_name]
        return self.db
    
    def get_collection(self, collection_name: str):
        """Get collection by name."""
        return self.db[collection_name]
    
    def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            logger.info("MongoDB client closed")


# Singleton instance
_mongo_client = None


def get_mongodb_client() -> MongoDBClient:
    """Get or create MongoDB client singleton."""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoDBClient()
    return _mongo_client

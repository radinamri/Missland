"""
MongoDB document schemas using Python dataclasses.
These mirror the Django ORM models but are optimized for MongoDB.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Optional
from bson import ObjectId


@dataclass
class PostDocument:
    """MongoDB document schema for Post."""
    title: str
    image_url: str
    width: int
    height: int
    shape: str = ""
    pattern: str = ""
    size: str = ""
    colors: List[str] = field(default_factory=list)
    try_on_image_url: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    _id: Optional[ObjectId] = None
    legacy_pg_id: Optional[int] = None  # Original PostgreSQL ID for migration reference
    
    # Nail Search Microservice classification data
    embedding_id: Optional[str] = None  # UUID from microservice for vector search
    classified_at: Optional[datetime] = None  # When classification was performed
    classification_confidence: Optional[float] = None  # Confidence score (0-1)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for MongoDB insertion."""
        data = asdict(self)
        if self._id is None:
            data.pop('_id', None)
        return data
    
    def to_serializer_dict(self) -> dict:
        """Convert to format expected by Django serializers."""
        return {
            'id': self.legacy_pg_id or str(self._id),
            'title': self.title,
            'image_url': self.image_url,
            'width': self.width,
            'height': self.height,
            'shape': self.shape,
            'pattern': self.pattern,
            'size': self.size,
            'colors': self.colors,
            'try_on_image_url': self.try_on_image_url,
        }
    
    @classmethod
    def from_mongo(cls, doc: dict) -> 'PostDocument':
        """Create PostDocument from MongoDB document."""
        return cls(
            _id=doc.get('_id'),
            title=doc.get('title', ''),
            image_url=doc.get('image_url', ''),
            width=doc.get('width', 0),
            height=doc.get('height', 0),
            shape=doc.get('shape', ''),
            pattern=doc.get('pattern', ''),
            size=doc.get('size', ''),
            colors=doc.get('colors', []),
            try_on_image_url=doc.get('try_on_image_url', ''),
            created_at=doc.get('created_at', datetime.utcnow()),
            legacy_pg_id=doc.get('legacy_pg_id'),
            embedding_id=doc.get('embedding_id'),
            classified_at=doc.get('classified_at'),
            classification_confidence=doc.get('classification_confidence'),
        )


@dataclass
class CollectionDocument:
    """MongoDB document schema for Collection."""
    user_id: int  # Reference to PostgreSQL User.id
    name: str
    post_ids: List[str] = field(default_factory=list)  # List of Post ObjectId strings
    created_at: datetime = field(default_factory=datetime.utcnow)
    _id: Optional[ObjectId] = None
    legacy_pg_id: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for MongoDB insertion."""
        data = asdict(self)
        if self._id is None:
            data.pop('_id', None)
        return data
    
    def to_serializer_dict(self, post_count: int = 0, posts_preview: Optional[List[str]] = None) -> dict:
        """Convert to format expected by Django serializers."""
        return {
            'id': self.legacy_pg_id or str(self._id),
            'name': self.name,
            'post_count': post_count,
            'posts_preview': posts_preview or [],
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }
    
    @classmethod
    def from_mongo(cls, doc: dict) -> 'CollectionDocument':
        """Create CollectionDocument from MongoDB document."""
        return cls(
            _id=doc.get('_id'),
            user_id=doc.get('user_id'),
            name=doc.get('name', ''),
            post_ids=doc.get('post_ids', []),
            created_at=doc.get('created_at', datetime.utcnow()),
            legacy_pg_id=doc.get('legacy_pg_id'),
        )


@dataclass
class TryOnDocument:
    """MongoDB document schema for TryOn."""
    user_id: int  # Reference to PostgreSQL User.id
    post_id: str  # Post ObjectId string
    created_at: datetime = field(default_factory=datetime.utcnow)
    _id: Optional[ObjectId] = None
    legacy_pg_id: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for MongoDB insertion."""
        data = asdict(self)
        if self._id is None:
            data.pop('_id', None)
        return data
    
    def to_serializer_dict(self, post_data: Optional[dict] = None) -> dict:
        """Convert to format expected by Django serializers."""
        return {
            'id': self.legacy_pg_id or str(self._id),
            'post': post_data or {'id': self.post_id},
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
        }
    
    @classmethod
    def from_mongo(cls, doc: dict) -> 'TryOnDocument':
        """Create TryOnDocument from MongoDB document."""
        return cls(
            _id=doc.get('_id'),
            user_id=doc.get('user_id'),
            post_id=doc.get('post_id', ''),
            created_at=doc.get('created_at', datetime.utcnow()),
            legacy_pg_id=doc.get('legacy_pg_id'),
        )

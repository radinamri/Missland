"""
MongoDB Import Script for Nail Image Annotations
================================================

This script imports nail image annotations and metadata to MongoDB with:
- Bulk operations for high performance
- Multiprocessing for parallel processing
- Image path validation (case-insensitive)
- Optional GridFS support for image storage
- Progress tracking and comprehensive logging

Best Practices Implemented:
- File path reference (preferred over base64)
- Configurable batch sizes (1000 default)
- Parallel processing with multiple workers
- Indexes for efficient querying
- Error handling and recovery
"""

import json
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from concurrent.futures import ProcessPoolExecutor, as_completed
from multiprocessing import cpu_count
import logging
from datetime import datetime

# MongoDB imports
from pymongo import MongoClient, ASCENDING, IndexModel
from pymongo.errors import BulkWriteError, ConnectionFailure
import gridfs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(processName)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Configuration for MongoDB import"""
    
    # MongoDB connection
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DATABASE_NAME = "nail_search_db"
    COLLECTION_NAME = "nail_images"
    
    # File paths
    ANNOTATIONS_PATH = "output/nail_images_annotations/annotations.json"
    IMAGES_DIR = "nail_images"
    
    # Performance settings
    BATCH_SIZE = 1000  # Documents per bulk operation (optimal: 500-2000)
    NUM_WORKERS = max(1, cpu_count() - 1)  # Leave 1 CPU free
    
    # Storage options
    USE_GRIDFS = False  # Set to True to store images in GridFS instead of file paths
    STORE_ABSOLUTE_PATH = True  # Store absolute paths vs relative
    
    # MongoDB write concern (adjust for durability vs performance)
    WRITE_CONCERN_W = 1  # 1 = acknowledge, 'majority' = wait for majority
    
    # Image extensions to search for (case-insensitive)
    IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.jPG', '.JPEG', '.PNG']


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def find_image_file(image_name: str, images_dir: Path) -> Optional[Path]:
    """
    Find image file with case-insensitive extension matching.
    
    Args:
        image_name: Base name from annotations (e.g., 'nail_image001.jpg')
        images_dir: Directory containing images
        
    Returns:
        Path to found image or None
    """
    base_name = Path(image_name).stem
    
    # Try exact match first
    image_path = images_dir / image_name
    if image_path.exists() and image_path.is_file():
        return image_path
    
    # Try all possible extensions
    for ext in Config.IMAGE_EXTENSIONS:
        test_path = images_dir / f"{base_name}{ext}"
        if test_path.exists() and test_path.is_file():
            return test_path
    
    # Try case-insensitive search
    try:
        for file in images_dir.iterdir():
            if file.stem == base_name and file.is_file():
                return file
    except Exception as e:
        logger.warning(f"Error searching for {image_name}: {e}")
    
    return None


def transform_annotation(annotation: Dict[str, Any], images_dir: Path) -> Optional[Dict[str, Any]]:
    """
    Transform annotation to desired schema and add image path.
    
    Desired schema:
    {
        "image_name": "nail_image003.jpg",
        "image_path": "/absolute/path/to/image.jpg",  # or relative
        "shape": "almond",
        "shape_source": "ground_truth",
        "pattern": "glossy",
        "pattern_source": "predicted",
        "colors": ["yellow", "brown", "white"],
        "size": "medium",
        "num_nails_detected": 3,
        "created_at": ISODate("2025-10-20T...")
    }
    
    Args:
        annotation: Original annotation dict
        images_dir: Path to images directory
        
    Returns:
        Transformed document or None if image not found
    """
    image_name = annotation.get("image_name")
    if not image_name:
        logger.warning("Annotation missing image_name")
        return None
    
    # Find the actual image file
    image_path = find_image_file(image_name, images_dir)
    if not image_path:
        logger.warning(f"Image not found: {image_name}")
        return None
    
    # Prepare path string
    if Config.STORE_ABSOLUTE_PATH:
        path_str = str(image_path.absolute())
    else:
        path_str = str(image_path.relative_to(Path.cwd()))
    
    # Transform to desired schema (remove confidence scores)
    document = {
        "image_name": image_name,
        "image_path": path_str,
        "shape": annotation.get("shape"),
        "shape_source": annotation.get("shape_source"),
        "pattern": annotation.get("pattern"),
        "pattern_source": annotation.get("pattern_source"),
        "colors": annotation.get("colors", []),
        "size": annotation.get("size"),
        "num_nails_detected": annotation.get("num_nails_detected", 0),
        "created_at": datetime.utcnow()
    }
    
    return document


def upload_to_gridfs(image_path: Path, fs: gridfs.GridFS) -> Optional[str]:
    """
    Upload image to GridFS and return file ID.
    
    Args:
        image_path: Path to image file
        fs: GridFS instance
        
    Returns:
        GridFS file ID as string or None
    """
    try:
        with open(image_path, 'rb') as img_file:
            file_id = fs.put(
                img_file,
                filename=image_path.name,
                content_type=f"image/{image_path.suffix[1:]}"
            )
        return str(file_id)
    except Exception as e:
        logger.error(f"Failed to upload {image_path} to GridFS: {e}")
        return None


# ============================================================================
# BULK PROCESSING
# ============================================================================

def process_chunk(
    chunk: List[Dict[str, Any]],
    chunk_id: int,
    total_chunks: int
) -> Dict[str, Any]:
    """
    Process a chunk of annotations in a separate process.
    Each process creates its own MongoDB connection.
    
    Args:
        chunk: List of annotations to process
        chunk_id: Chunk identifier
        total_chunks: Total number of chunks
        
    Returns:
        Statistics dict
    """
    start_time = time.time()
    
    try:
        # Create MongoDB connection for this process
        client = MongoClient(
            Config.MONGODB_URI,
            w=Config.WRITE_CONCERN_W,
            maxPoolSize=1
        )
        db = client[Config.DATABASE_NAME]
        collection = db[Config.COLLECTION_NAME]
        
        # Setup GridFS if needed
        fs = gridfs.GridFS(db) if Config.USE_GRIDFS else None
        
        # Prepare paths
        images_dir = Path(Config.IMAGES_DIR).resolve()
        
        # Transform annotations
        documents = []
        skipped = 0
        
        for annotation in chunk:
            doc = transform_annotation(annotation, images_dir)
            if doc:
                # Add GridFS file if enabled
                if Config.USE_GRIDFS and fs:
                    image_path = Path(doc["image_path"])
                    file_id = upload_to_gridfs(image_path, fs)
                    if file_id:
                        doc["gridfs_file_id"] = file_id
                    else:
                        skipped += 1
                        continue
                
                documents.append(doc)
            else:
                skipped += 1
        
        # Bulk insert with batching
        inserted = 0
        errors = []
        
        for i in range(0, len(documents), Config.BATCH_SIZE):
            batch = documents[i:i + Config.BATCH_SIZE]
            try:
                result = collection.insert_many(batch, ordered=False)
                inserted += len(result.inserted_ids)
            except BulkWriteError as bwe:
                # Continue on errors, log them
                inserted += bwe.details.get('nInserted', 0)
                errors.extend(bwe.details.get('writeErrors', []))
                logger.warning(f"Chunk {chunk_id}: Bulk write errors: {len(errors)}")
        
        elapsed = time.time() - start_time
        
        stats = {
            "chunk_id": chunk_id,
            "total_chunks": total_chunks,
            "processed": len(chunk),
            "inserted": inserted,
            "skipped": skipped,
            "errors": len(errors),
            "elapsed_seconds": round(elapsed, 2),
            "docs_per_second": round(inserted / elapsed, 2) if elapsed > 0 else 0
        }
        
        logger.info(
            f"Chunk {chunk_id}/{total_chunks}: "
            f"Inserted {inserted}/{len(chunk)} documents "
            f"({stats['docs_per_second']} docs/sec)"
        )
        
        client.close()
        return stats
        
    except Exception as e:
        logger.error(f"Chunk {chunk_id} failed: {e}")
        return {
            "chunk_id": chunk_id,
            "total_chunks": total_chunks,
            "processed": 0,
            "inserted": 0,
            "skipped": len(chunk),
            "errors": 1,
            "elapsed_seconds": time.time() - start_time,
            "error_message": str(e)
        }


def create_indexes(collection):
    """
    Create indexes for efficient querying.
    
    Common query patterns:
    - Search by image_name (unique)
    - Filter by shape, pattern, size
    - Search by colors (array)
    - Sort by num_nails_detected
    """
    logger.info("Creating indexes...")
    
    indexes = [
        IndexModel([("image_name", ASCENDING)], unique=True, name="idx_image_name"),
        IndexModel([("shape", ASCENDING)], name="idx_shape"),
        IndexModel([("pattern", ASCENDING)], name="idx_pattern"),
        IndexModel([("size", ASCENDING)], name="idx_size"),
        IndexModel([("colors", ASCENDING)], name="idx_colors"),
        IndexModel([("num_nails_detected", ASCENDING)], name="idx_num_nails"),
        IndexModel([("created_at", ASCENDING)], name="idx_created_at"),
        # Compound indexes for common queries
        IndexModel([("shape", ASCENDING), ("pattern", ASCENDING)], name="idx_shape_pattern"),
        IndexModel([("size", ASCENDING), ("colors", ASCENDING)], name="idx_size_colors"),
    ]
    
    try:
        collection.create_indexes(indexes)
        logger.info(f"Created {len(indexes)} indexes")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


# ============================================================================
# MAIN IMPORT FUNCTION
# ============================================================================

def import_to_mongodb():
    """
    Main function to import annotations to MongoDB with multiprocessing.
    """
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("MongoDB Import - Nail Image Annotations")
    logger.info("=" * 80)
    logger.info(f"Configuration:")
    logger.info(f"  MongoDB URI: {Config.MONGODB_URI}")
    logger.info(f"  Database: {Config.DATABASE_NAME}")
    logger.info(f"  Collection: {Config.COLLECTION_NAME}")
    logger.info(f"  Batch Size: {Config.BATCH_SIZE}")
    logger.info(f"  Workers: {Config.NUM_WORKERS}")
    logger.info(f"  Use GridFS: {Config.USE_GRIDFS}")
    logger.info(f"  Store Absolute Paths: {Config.STORE_ABSOLUTE_PATH}")
    logger.info("=" * 80)
    
    # Load annotations
    logger.info(f"Loading annotations from {Config.ANNOTATIONS_PATH}...")
    annotations_path = Path(Config.ANNOTATIONS_PATH)
    
    if not annotations_path.exists():
        logger.error(f"Annotations file not found: {annotations_path}")
        return
    
    with open(annotations_path, 'r') as f:
        data = json.load(f)
    
    annotations = data.get("annotations", [])
    total_annotations = len(annotations)
    
    logger.info(f"Loaded {total_annotations} annotations")
    
    if total_annotations == 0:
        logger.warning("No annotations to process")
        return
    
    # Test MongoDB connection
    try:
        client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
        logger.info("✓ MongoDB connection successful")
    except ConnectionFailure as e:
        logger.error(f"✗ MongoDB connection failed: {e}")
        logger.error("Please ensure MongoDB is running and accessible")
        return
    
    # Optionally clear existing collection
    db = client[Config.DATABASE_NAME]
    collection = db[Config.COLLECTION_NAME]
    
    existing_count = collection.count_documents({})
    if existing_count > 0:
        logger.warning(f"Collection already contains {existing_count} documents")
        response = input("Clear existing collection? (yes/no): ").strip().lower()
        if response == 'yes':
            collection.delete_many({})
            logger.info("Collection cleared")
        else:
            logger.info("Continuing with existing data (may cause duplicates)")
    
    client.close()
    
    # Split annotations into chunks for parallel processing
    chunk_size = max(1, total_annotations // Config.NUM_WORKERS)
    chunks = [
        annotations[i:i + chunk_size]
        for i in range(0, total_annotations, chunk_size)
    ]
    
    logger.info(f"Split into {len(chunks)} chunks (~{chunk_size} docs each)")
    logger.info("Starting parallel import...")
    
    # Process chunks in parallel
    all_stats = []
    
    with ProcessPoolExecutor(max_workers=Config.NUM_WORKERS) as executor:
        futures = {
            executor.submit(process_chunk, chunk, idx + 1, len(chunks)): idx
            for idx, chunk in enumerate(chunks)
        }
        
        for future in as_completed(futures):
            try:
                stats = future.result()
                all_stats.append(stats)
            except Exception as e:
                logger.error(f"Chunk processing exception: {e}")
    
    # Aggregate statistics
    total_inserted = sum(s.get("inserted", 0) for s in all_stats)
    total_skipped = sum(s.get("skipped", 0) for s in all_stats)
    total_errors = sum(s.get("errors", 0) for s in all_stats)
    
    elapsed = time.time() - start_time
    
    # Create indexes after import (faster than during import)
    logger.info("\nCreating database indexes...")
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.DATABASE_NAME]
    collection = db[Config.COLLECTION_NAME]
    create_indexes(collection)
    
    # Final statistics
    logger.info("=" * 80)
    logger.info("Import Complete!")
    logger.info("=" * 80)
    logger.info(f"Total Annotations: {total_annotations}")
    logger.info(f"Successfully Inserted: {total_inserted}")
    logger.info(f"Skipped (no image): {total_skipped}")
    logger.info(f"Errors: {total_errors}")
    logger.info(f"Total Time: {elapsed:.2f} seconds")
    logger.info(f"Average Speed: {total_inserted / elapsed:.2f} docs/sec")
    logger.info("=" * 80)
    
    # Verify final count
    final_count = collection.count_documents({})
    logger.info(f"Final collection count: {final_count}")
    
    # Sample document
    logger.info("\nSample document:")
    sample = collection.find_one()
    if sample:
        sample.pop('_id', None)
        logger.info(json.dumps(sample, indent=2, default=str))
    
    client.close()


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import sys
    
    # Check for pymongo
    try:
        import pymongo
        logger.info(f"Using pymongo version {pymongo.__version__}")
    except ImportError:
        logger.error("pymongo not found. Install with: pip install pymongo")
        sys.exit(1)
    
    # Run import
    try:
        import_to_mongodb()
    except KeyboardInterrupt:
        logger.warning("\nImport interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Import failed: {e}", exc_info=True)
        sys.exit(1)

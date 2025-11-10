"""
Management command to create MongoDB indexes for optimal query performance.

Usage:
    python manage.py create_mongo_indexes --drop-existing
"""

import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from core.mongodb_client import get_mongodb_client
from pymongo import ASCENDING, DESCENDING, IndexModel


class Command(BaseCommand):
    help = 'Create MongoDB indexes for Posts, Collections, and TryOns'

    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-existing',
            action='store_true',
            help='Drop existing indexes before creating new ones (except _id index)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what indexes would be created without actually creating them'
        )

    def handle(self, *args, **options):
        drop_existing = options['drop_existing']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 Running in DRY-RUN mode - no indexes will be created'))

        try:
            self._create_indexes_async(drop_existing, dry_run)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Index creation failed: {str(e)}'))
            raise

    def _create_indexes_async(self, drop_existing: bool, dry_run: bool):
        """Create indexes for all MongoDB collections"""
        mongo_client = get_mongodb_client()
        db = mongo_client.db  # Use the db property instead of subscript

        self.stdout.write(self.style.MIGRATE_HEADING('📑 Creating MongoDB Indexes...\n'))

        # Create indexes for Posts collection
        self._create_posts_indexes(db, drop_existing, dry_run)

        # Create indexes for Collections collection
        self._create_collections_indexes(db, drop_existing, dry_run)

        # Create indexes for TryOns collection
        self._create_tryons_indexes(db, drop_existing, dry_run)

        self.stdout.write(self.style.SUCCESS('\n✅ Index creation completed!'))

    def _create_posts_indexes(self, db, drop_existing: bool, dry_run: bool):
        """Create indexes for Posts collection"""
        self.stdout.write(self.style.MIGRATE_LABEL('Posts Collection:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['posts']]

        # Drop existing indexes if requested
        if drop_existing and not dry_run:
            existing_indexes = collection.index_information()
            for index_name in existing_indexes:
                if index_name != '_id_':  # Never drop the _id index
                    collection.drop_index(index_name)
                    self.stdout.write(f'   🗑️  Dropped existing index: {index_name}')

        # Define indexes
        indexes = [
            IndexModel(
                [('created_at', DESCENDING), ('_id', DESCENDING)],
                name='pagination_index',
                background=True
            ),
            IndexModel(
                [('shape', ASCENDING), ('pattern', ASCENDING), ('size', ASCENDING)],
                name='filter_compound_index',
                background=True
            ),
            IndexModel(
                [('colors', ASCENDING)],
                name='colors_array_index',
                background=True
            ),
            IndexModel(
                [('legacy_pg_id', ASCENDING)],
                name='legacy_id_index',
                unique=True,
                background=True,
                sparse=True  # Only index documents that have this field
            ),
            IndexModel(
                [('shape', ASCENDING)],
                name='shape_index',
                background=True
            ),
            IndexModel(
                [('pattern', ASCENDING)],
                name='pattern_index',
                background=True
            ),
            IndexModel(
                [('size', ASCENDING)],
                name='size_index',
                background=True
            ),
        ]

        if dry_run:
            self.stdout.write('   📋 Would create indexes:')
            for index in indexes:
                keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                self.stdout.write(f'      - {index.document["name"]}: ({keys})')
        else:
            for index in indexes:
                try:
                    collection.create_indexes([index])
                    keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                    self.stdout.write(self.style.SUCCESS(f'   ✓ Created: {index.document["name"]} ({keys})'))
                except Exception as e:
                    import traceback
                    self.stdout.write(self.style.ERROR(f'   ✗ Failed to create {index.document["name"]}: {str(e)}'))
                    self.stdout.write(traceback.format_exc())

    def _create_collections_indexes(self, db, drop_existing: bool, dry_run: bool):
        """Create indexes for Collections collection"""
        self.stdout.write(self.style.MIGRATE_LABEL('\nCollections Collection:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['collections']]

        # Drop existing indexes if requested
        if drop_existing and not dry_run:
            existing_indexes = collection.index_information()
            for index_name in existing_indexes:
                if index_name != '_id_':
                    collection.drop_index(index_name)
                    self.stdout.write(f'   🗑️  Dropped existing index: {index_name}')

        # Define indexes
        indexes = [
            IndexModel(
                [('user_id', ASCENDING), ('name', ASCENDING)],
                name='user_collection_unique',
                unique=True,
                background=True
            ),
            IndexModel(
                [('user_id', ASCENDING), ('created_at', DESCENDING)],
                name='user_collections_index',
                background=True
            ),
            IndexModel(
                [('post_ids', ASCENDING)],
                name='post_ids_array_index',
                background=True
            ),
            IndexModel(
                [('legacy_pg_id', ASCENDING)],
                name='legacy_id_index',
                unique=True,
                background=True,
                sparse=True
            ),
        ]

        if dry_run:
            self.stdout.write('   📋 Would create indexes:')
            for index in indexes:
                keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                self.stdout.write(f'      - {index.document["name"]}: ({keys})')
        else:
            for index in indexes:
                try:
                    collection.create_indexes([index])
                    keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                    self.stdout.write(self.style.SUCCESS(f'   ✓ Created: {index.document["name"]} ({keys})'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'   ✗ Failed to create {index.document["name"]}: {str(e)}'))

    def _create_tryons_indexes(self, db, drop_existing: bool, dry_run: bool):
        """Create indexes for TryOns collection"""
        self.stdout.write(self.style.MIGRATE_LABEL('\nTryOns Collection:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['tryons']]

        # Drop existing indexes if requested
        if drop_existing and not dry_run:
            existing_indexes = collection.index_information()
            for index_name in existing_indexes:
                if index_name != '_id_':
                    collection.drop_index(index_name)
                    self.stdout.write(f'   🗑️  Dropped existing index: {index_name}')

        # Define indexes
        indexes = [
            IndexModel(
                [('user_id', ASCENDING), ('post_id', ASCENDING)],
                name='user_post_unique',
                unique=True,
                background=True
            ),
            IndexModel(
                [('user_id', ASCENDING), ('created_at', DESCENDING)],
                name='user_tryons_index',
                background=True
            ),
            IndexModel(
                [('post_id', ASCENDING)],
                name='post_tryons_index',
                background=True
            ),
            IndexModel(
                [('legacy_pg_id', ASCENDING)],
                name='legacy_id_index',
                unique=True,
                background=True,
                sparse=True
            ),
        ]

        if dry_run:
            self.stdout.write('   📋 Would create indexes:')
            for index in indexes:
                keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                self.stdout.write(f'      - {index.document["name"]}: ({keys})')
        else:
            for index in indexes:
                try:
                    collection.create_indexes([index])
                    keys = ', '.join([f'{k}: {v}' for k, v in index.document['key'].items()])
                    self.stdout.write(self.style.SUCCESS(f'   ✓ Created: {index.document["name"]} ({keys})'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'   ✗ Failed to create {index.document["name"]}: {str(e)}'))

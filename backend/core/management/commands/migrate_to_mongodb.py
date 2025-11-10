"""
Management command to migrate data from PostgreSQL to MongoDB.

Usage:
    python manage.py migrate_to_mongodb --models=posts,collections,tryons --batch-size=500 --dry-run
"""

import asyncio
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction
from asgiref.sync import sync_to_async
from core.models import Post, Collection, TryOn
from core.mongodb_client import get_mongodb_client
from core.mongo_models import PostDocument, CollectionDocument, TryOnDocument
from datetime import datetime
from typing import List, Dict, Any
import sys


class Command(BaseCommand):
    help = 'Migrate data from PostgreSQL to MongoDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--models',
            type=str,
            default='posts,collections,tryons',
            help='Comma-separated list of models to migrate (posts, collections, tryons)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of records to process in each batch'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run migration without actually writing to MongoDB'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip records that already exist in MongoDB (based on legacy_pg_id)'
        )
        parser.add_argument(
            '--clear-mongodb',
            action='store_true',
            help='Clear MongoDB collections before migration (DESTRUCTIVE)'
        )

    def handle(self, *args, **options):
        # Validate models argument
        models_to_migrate = [m.strip() for m in options['models'].split(',')]
        valid_models = {'posts', 'collections', 'tryons'}
        invalid_models = set(models_to_migrate) - valid_models
        
        if invalid_models:
            raise CommandError(f"Invalid models: {', '.join(invalid_models)}. Valid options: {', '.join(valid_models)}")

        batch_size = options['batch_size']
        dry_run = options['dry_run']
        skip_existing = options['skip_existing']
        clear_mongodb = options['clear_mongodb']

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 Running in DRY-RUN mode - no data will be written to MongoDB'))
        
        if clear_mongodb and not dry_run:
            confirm = input(self.style.ERROR('⚠️  WARNING: This will DELETE all data in MongoDB collections. Type "yes" to confirm: '))
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Migration cancelled.'))
                return

        # Run async migration
        try:
            self._migrate_async(
                models_to_migrate=models_to_migrate,
                batch_size=batch_size,
                dry_run=dry_run,
                skip_existing=skip_existing,
                clear_mongodb=clear_mongodb
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Migration failed: {str(e)}'))
            raise

    def _migrate_async(
        self,
        models_to_migrate: List[str],
        batch_size: int,
        dry_run: bool,
        skip_existing: bool,
        clear_mongodb: bool
    ):
        """Async migration logic"""
        client = get_mongodb_client()
        db = client.get_database(settings.MONGODB_SETTINGS['database'])
        
        # Clear collections if requested
        if clear_mongodb and not dry_run:
            self.stdout.write(self.style.WARNING('🗑️  Clearing MongoDB collections...'))
            if 'posts' in models_to_migrate:
                db[settings.MONGODB_SETTINGS['collections']['posts']].delete_many({})
                self.stdout.write('   - Posts collection cleared')
            if 'collections' in models_to_migrate:
                db[settings.MONGODB_SETTINGS['collections']['collections']].delete_many({})
                self.stdout.write('   - Collections collection cleared')
            if 'tryons' in models_to_migrate:
                db[settings.MONGODB_SETTINGS['collections']['tryons']].delete_many({})
                self.stdout.write('   - TryOns collection cleared')

        # Migrate Posts
        if 'posts' in models_to_migrate:
            self._migrate_posts(db, batch_size, dry_run, skip_existing)

        # Migrate Collections (depends on Posts)
        if 'collections' in models_to_migrate:
            self._migrate_collections(db, batch_size, dry_run, skip_existing)

        # Migrate TryOns (depends on Posts)
        if 'tryons' in models_to_migrate:
            self._migrate_tryons(db, batch_size, dry_run, skip_existing)

        self.stdout.write(self.style.SUCCESS('\n✅ Migration completed successfully!'))

    def _migrate_posts(self, db, batch_size: int, dry_run: bool, skip_existing: bool):
        """Migrate Post records from PostgreSQL to MongoDB"""
        self.stdout.write(self.style.MIGRATE_HEADING('\n📦 Migrating Posts...'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        total_count = Post.objects.count()
        
        if total_count == 0:
            self.stdout.write('   No posts to migrate')
            return

        self.stdout.write(f'   Total posts in PostgreSQL: {total_count}')
        
        migrated = 0
        skipped = 0
        errors = 0
        
        # Process in batches
        for offset in range(0, total_count, batch_size):
            posts = list(Post.objects.all()[offset:offset + batch_size])
            
            for post in posts:
                try:
                    # Check if already exists
                    if skip_existing:
                        existing = collection.find_one({'legacy_pg_id': post.id})
                        if existing:
                            skipped += 1
                            continue

                    # Create MongoDB document
                    doc = PostDocument(
                        title=post.title,
                        image_url=post.image_url,
                        width=post.width,
                        height=post.height,
                        shape=post.shape or '',
                        pattern=post.pattern or '',
                        size=post.size or '',
                        colors=post.colors if post.colors else [],
                        try_on_image_url=post.try_on_image_url or '',
                        created_at=post.created_at,
                        legacy_pg_id=post.id
                    )

                    if not dry_run:
                        # Upsert document
                        collection.update_one(
                            {'legacy_pg_id': post.id},
                            {'$set': doc.to_dict()},
                            upsert=True
                        )
                    
                    migrated += 1
                    
                    # Progress indicator
                    if migrated % 100 == 0:
                        self.stdout.write(f'   Progress: {migrated}/{total_count} posts', ending='\r')
                        self.stdout.flush()

                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(f'\n   Error migrating post {post.id}: {str(e)}'))

        self.stdout.write(f'\n   ✓ Migrated: {migrated}')
        if skipped > 0:
            self.stdout.write(f'   ⊘ Skipped: {skipped}')
        if errors > 0:
            self.stdout.write(self.style.ERROR(f'   ✗ Errors: {errors}'))

    def _migrate_collections(self, db, batch_size: int, dry_run: bool, skip_existing: bool):
        """Migrate Collection records from PostgreSQL to MongoDB"""
        self.stdout.write(self.style.MIGRATE_HEADING('\n📚 Migrating Collections...'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['collections']]
        posts_collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        
        total_count = Collection.objects.count()
        
        if total_count == 0:
            self.stdout.write('   No collections to migrate')
            return

        self.stdout.write(f'   Total collections in PostgreSQL: {total_count}')
        
        migrated = 0
        skipped = 0
        errors = 0
        
        # Process in batches
        for offset in range(0, total_count, batch_size):
            collections = list(Collection.objects.prefetch_related('posts').all()[offset:offset + batch_size])
            
            for coll in collections:
                try:
                    # Check if already exists
                    if skip_existing:
                        existing = collection.find_one({'legacy_pg_id': coll.id})
                        if existing:
                            skipped += 1
                            continue

                    # Resolve post IDs from PostgreSQL to MongoDB
                    post_ids = []
                    coll_posts = list(coll.posts.all())
                    for post in coll_posts:
                        mongo_post = posts_collection.find_one({'legacy_pg_id': post.id})
                        if mongo_post:
                            post_ids.append(str(mongo_post['_id']))

                    # Create MongoDB document
                    doc = CollectionDocument(
                        user_id=coll.user_id,
                        name=coll.name,
                        post_ids=post_ids,
                        created_at=coll.created_at,
                        legacy_pg_id=coll.id
                    )

                    if not dry_run:
                        # Upsert document
                        collection.update_one(
                            {'legacy_pg_id': coll.id},
                            {'$set': doc.to_dict()},
                            upsert=True
                        )
                    
                    migrated += 1
                    
                    # Progress indicator
                    if migrated % 50 == 0:
                        self.stdout.write(f'   Progress: {migrated}/{total_count} collections', ending='\r')
                        self.stdout.flush()

                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(f'\n   Error migrating collection {coll.id}: {str(e)}'))

        self.stdout.write(f'\n   ✓ Migrated: {migrated}')
        if skipped > 0:
            self.stdout.write(f'   ⊘ Skipped: {skipped}')
        if errors > 0:
            self.stdout.write(self.style.ERROR(f'   ✗ Errors: {errors}'))

    def _migrate_tryons(self, db, batch_size: int, dry_run: bool, skip_existing: bool):
        """Migrate TryOn records from PostgreSQL to MongoDB"""
        self.stdout.write(self.style.MIGRATE_HEADING('\n💅 Migrating TryOns...'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['tryons']]
        posts_collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        
        total_count = TryOn.objects.count()
        
        if total_count == 0:
            self.stdout.write('   No try-ons to migrate')
            return

        self.stdout.write(f'   Total try-ons in PostgreSQL: {total_count}')
        
        migrated = 0
        skipped = 0
        errors = 0
        
        # Process in batches
        for offset in range(0, total_count, batch_size):
            tryons = list(TryOn.objects.select_related('post').all()[offset:offset + batch_size])
            
            for tryon in tryons:
                try:
                    # Check if already exists
                    if skip_existing:
                        existing = collection.find_one({'legacy_pg_id': tryon.id})
                        if existing:
                            skipped += 1
                            continue

                    # Resolve post ID from PostgreSQL to MongoDB
                    mongo_post = posts_collection.find_one({'legacy_pg_id': tryon.post_id})
                    if not mongo_post:
                        self.stdout.write(self.style.WARNING(f'\n   Warning: Post {tryon.post_id} not found in MongoDB, skipping tryon {tryon.id}'))
                        skipped += 1
                        continue

                    # Create MongoDB document
                    doc = TryOnDocument(
                        user_id=tryon.user_id,
                        post_id=str(mongo_post['_id']),
                        created_at=tryon.created_at,
                        legacy_pg_id=tryon.id
                    )

                    if not dry_run:
                        # Upsert document
                        collection.update_one(
                            {'legacy_pg_id': tryon.id},
                            {'$set': doc.to_dict()},
                            upsert=True
                        )
                    
                    migrated += 1
                    
                    # Progress indicator
                    if migrated % 100 == 0:
                        self.stdout.write(f'   Progress: {migrated}/{total_count} try-ons', ending='\r')
                        self.stdout.flush()

                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(f'\n   Error migrating try-on {tryon.id}: {str(e)}'))

        self.stdout.write(f'\n   ✓ Migrated: {migrated}')
        if skipped > 0:
            self.stdout.write(f'   ⊘ Skipped: {skipped}')
        if errors > 0:
            self.stdout.write(self.style.ERROR(f'   ✗ Errors: {errors}'))

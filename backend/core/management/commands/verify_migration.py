"""
Management command to verify data integrity after MongoDB migration.

Usage:
    python manage.py verify_migration --detailed --sample-size=10
"""

import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Post, Collection, TryOn
from core.mongodb_client import get_mongodb_client
from typing import Dict, Any, List
import random
from asgiref.sync import sync_to_async


class Command(BaseCommand):
    help = 'Verify data migration from PostgreSQL to MongoDB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Perform detailed verification including data sampling'
        )
        parser.add_argument(
            '--sample-size',
            type=int,
            default=10,
            help='Number of random records to sample for detailed verification'
        )
        parser.add_argument(
            '--check-orphans',
            action='store_true',
            help='Check for orphaned references (collections referencing non-existent posts)'
        )

    def handle(self, *args, **options):
        detailed = options['detailed']
        sample_size = options['sample_size']
        check_orphans = options['check_orphans']

        try:
            self._verify_async(detailed, sample_size, check_orphans)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Verification failed: {str(e)}'))
            raise

    def _verify_async(self, detailed: bool, sample_size: int, check_orphans: bool):
        """Verify migration data integrity"""
        client = get_mongodb_client()
        db = client.get_database(settings.MONGODB_SETTINGS['database'])

        self.stdout.write(self.style.MIGRATE_HEADING('🔍 MongoDB Migration Verification\n'))

        # Count comparison
        self._verify_counts(db)

        # Detailed verification
        if detailed:
            self.stdout.write('\n' + '='*60)
            self._verify_posts_sample(db, sample_size)
            self._verify_collections_sample(db, sample_size)
            self._verify_tryons_sample(db, sample_size)

        # Check for orphaned references
        if check_orphans:
            self.stdout.write('\n' + '='*60)
            self._check_orphaned_references(db)

        self.stdout.write('\n' + self.style.SUCCESS('✅ Verification completed!'))

    def _verify_counts(self, db):
        """Compare record counts between PostgreSQL and MongoDB"""
        self.stdout.write(self.style.MIGRATE_LABEL('📊 Record Count Comparison:'))
        
        # Posts
        pg_posts = Post.objects.count
        mongo_posts = db[settings.MONGODB_SETTINGS['collections']['posts']].count_documents({})
        posts_match = pg_posts == mongo_posts
        
        self.stdout.write(f'\n   Posts:')
        self.stdout.write(f'      PostgreSQL: {pg_posts}')
        self.stdout.write(f'      MongoDB:    {mongo_posts}')
        if posts_match:
            self.stdout.write(self.style.SUCCESS('      ✓ Counts match'))
        else:
            diff = abs(pg_posts - mongo_posts)
            self.stdout.write(self.style.ERROR(f'      ✗ Difference: {diff}'))

        # Collections
        pg_collections = Collection.objects.count
        mongo_collections = db[settings.MONGODB_SETTINGS['collections']['collections']].count_documents({})
        collections_match = pg_collections == mongo_collections
        
        self.stdout.write(f'\n   Collections:')
        self.stdout.write(f'      PostgreSQL: {pg_collections}')
        self.stdout.write(f'      MongoDB:    {mongo_collections}')
        if collections_match:
            self.stdout.write(self.style.SUCCESS('      ✓ Counts match'))
        else:
            diff = abs(pg_collections - mongo_collections)
            self.stdout.write(self.style.ERROR(f'      ✗ Difference: {diff}'))

        # TryOns
        pg_tryons = TryOn.objects.count
        mongo_tryons = db[settings.MONGODB_SETTINGS['collections']['tryons']].count_documents({})
        tryons_match = pg_tryons == mongo_tryons
        
        self.stdout.write(f'\n   TryOns:')
        self.stdout.write(f'      PostgreSQL: {pg_tryons}')
        self.stdout.write(f'      MongoDB:    {mongo_tryons}')
        if tryons_match:
            self.stdout.write(self.style.SUCCESS('      ✓ Counts match'))
        else:
            diff = abs(pg_tryons - mongo_tryons)
            self.stdout.write(self.style.ERROR(f'      ✗ Difference: {diff}'))

    def _verify_posts_sample(self, db, sample_size: int):
        """Verify random sample of posts"""
        self.stdout.write(self.style.MIGRATE_LABEL(f'\n🎨 Verifying {sample_size} Random Posts:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        
        # Get random posts from PostgreSQL
        pg_count = Post.objects.count
        if pg_count == 0:
            self.stdout.write('   No posts to verify')
            return
        
        sample_count = min(sample_size, pg_count)
        post_ids = sync_to_async(list)(Post.objects.values_list('id', flat=True))
        random_ids = random.sample(post_ids, sample_count)
        
        mismatches = []
        
        for pg_id in random_ids:
            pg_post = sync_to_async(Post.objects.get)(id=pg_id)
            mongo_post = collection.find_one({'legacy_pg_id': pg_id})
            
            if not mongo_post:
                mismatches.append(f'Post {pg_id} not found in MongoDB')
                continue
            
            # Verify key fields
            errors = []
            if pg_post.title != mongo_post.get('title'):
                errors.append('title mismatch')
            if pg_post.shape != mongo_post.get('shape', ''):
                errors.append('shape mismatch')
            if pg_post.pattern != mongo_post.get('pattern', ''):
                errors.append('pattern mismatch')
            if pg_post.size != mongo_post.get('size', ''):
                errors.append('size mismatch')
            if pg_post.colors != mongo_post.get('colors', []):
                errors.append('colors mismatch')
            
            if errors:
                mismatches.append(f'Post {pg_id}: {", ".join(errors)}')
        
        if mismatches:
            self.stdout.write(self.style.ERROR(f'\n   ✗ Found {len(mismatches)} mismatches:'))
            for mismatch in mismatches[:5]:  # Show first 5
                self.stdout.write(f'      - {mismatch}')
            if len(mismatches) > 5:
                self.stdout.write(f'      ... and {len(mismatches) - 5} more')
        else:
            self.stdout.write(self.style.SUCCESS(f'   ✓ All {sample_count} sampled posts match'))

    def _verify_collections_sample(self, db, sample_size: int):
        """Verify random sample of collections"""
        self.stdout.write(self.style.MIGRATE_LABEL(f'\n📚 Verifying {sample_size} Random Collections:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['collections']]
        posts_collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        
        # Get random collections from PostgreSQL
        pg_count = Collection.objects.count
        if pg_count == 0:
            self.stdout.write('   No collections to verify')
            return
        
        sample_count = min(sample_size, pg_count)
        collection_ids = sync_to_async(list)(Collection.objects.values_list('id', flat=True))
        random_ids = random.sample(collection_ids, sample_count)
        
        mismatches = []
        
        for pg_id in random_ids:
            pg_coll = sync_to_async(Collection.objects.prefetch_related('posts').get)(id=pg_id)
            mongo_coll = collection.find_one({'legacy_pg_id': pg_id})
            
            if not mongo_coll:
                mismatches.append(f'Collection {pg_id} not found in MongoDB')
                continue
            
            # Verify key fields
            errors = []
            if pg_coll.name != mongo_coll.get('name'):
                errors.append('name mismatch')
            if pg_coll.user_id != mongo_coll.get('user_id'):
                errors.append('user_id mismatch')
            
            # Verify post count (not exact IDs since they're different between DBs)
            pg_post_count = pg_coll.posts.count
            mongo_post_count = len(mongo_coll.get('post_ids', []))
            if pg_post_count != mongo_post_count:
                errors.append(f'post count mismatch (PG: {pg_post_count}, Mongo: {mongo_post_count})')
            
            if errors:
                mismatches.append(f'Collection {pg_id}: {", ".join(errors)}')
        
        if mismatches:
            self.stdout.write(self.style.ERROR(f'\n   ✗ Found {len(mismatches)} mismatches:'))
            for mismatch in mismatches[:5]:
                self.stdout.write(f'      - {mismatch}')
            if len(mismatches) > 5:
                self.stdout.write(f'      ... and {len(mismatches) - 5} more')
        else:
            self.stdout.write(self.style.SUCCESS(f'   ✓ All {sample_count} sampled collections match'))

    def _verify_tryons_sample(self, db, sample_size: int):
        """Verify random sample of try-ons"""
        self.stdout.write(self.style.MIGRATE_LABEL(f'\n💅 Verifying {sample_size} Random TryOns:'))
        
        collection = db[settings.MONGODB_SETTINGS['collections']['tryons']]
        
        # Get random try-ons from PostgreSQL
        pg_count = TryOn.objects.count
        if pg_count == 0:
            self.stdout.write('   No try-ons to verify')
            return
        
        sample_count = min(sample_size, pg_count)
        tryon_ids = sync_to_async(list)(TryOn.objects.values_list('id', flat=True))
        random_ids = random.sample(tryon_ids, sample_count)
        
        mismatches = []
        
        for pg_id in random_ids:
            pg_tryon = sync_to_async(TryOn.objects.select_related('post').get)(id=pg_id)
            mongo_tryon = collection.find_one({'legacy_pg_id': pg_id})
            
            if not mongo_tryon:
                mismatches.append(f'TryOn {pg_id} not found in MongoDB')
                continue
            
            # Verify key fields
            errors = []
            if pg_tryon.user_id != mongo_tryon.get('user_id'):
                errors.append('user_id mismatch')
            
            # We can't directly compare post_id since it's different between DBs
            # Just verify that a post_id exists
            if not mongo_tryon.get('post_id'):
                errors.append('missing post_id')
            
            if errors:
                mismatches.append(f'TryOn {pg_id}: {", ".join(errors)}')
        
        if mismatches:
            self.stdout.write(self.style.ERROR(f'\n   ✗ Found {len(mismatches)} mismatches:'))
            for mismatch in mismatches[:5]:
                self.stdout.write(f'      - {mismatch}')
            if len(mismatches) > 5:
                self.stdout.write(f'      ... and {len(mismatches) - 5} more')
        else:
            self.stdout.write(self.style.SUCCESS(f'   ✓ All {sample_count} sampled try-ons match'))

    def _check_orphaned_references(self, db):
        """Check for orphaned references in MongoDB"""
        self.stdout.write(self.style.MIGRATE_LABEL('\n🔗 Checking for Orphaned References:'))
        
        collections_collection = db[settings.MONGODB_SETTINGS['collections']['collections']]
        tryons_collection = db[settings.MONGODB_SETTINGS['collections']['tryons']]
        posts_collection = db[settings.MONGODB_SETTINGS['collections']['posts']]
        
        # Check Collections for non-existent posts
        self.stdout.write('\n   Checking Collections...')
        orphaned_in_collections = 0
        for coll in collections_collection.find():
            post_ids = coll.get('post_ids', [])
            for post_id in post_ids:
                from bson import ObjectId
                try:
                    post_exists = posts_collection.find_one({'_id': ObjectId(post_id)})
                    if not post_exists:
                        orphaned_in_collections += 1
                        self.stdout.write(self.style.WARNING(f'      Collection {coll["_id"]} references non-existent post {post_id}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'      Error checking post {post_id}: {str(e)}'))
        
        if orphaned_in_collections == 0:
            self.stdout.write(self.style.SUCCESS('      ✓ No orphaned post references in collections'))
        else:
            self.stdout.write(self.style.ERROR(f'      ✗ Found {orphaned_in_collections} orphaned references'))
        
        # Check TryOns for non-existent posts
        self.stdout.write('\n   Checking TryOns...')
        orphaned_in_tryons = 0
        for tryon in tryons_collection.find():
            post_id = tryon.get('post_id')
            if post_id:
                from bson import ObjectId
                try:
                    post_exists = posts_collection.find_one({'_id': ObjectId(post_id)})
                    if not post_exists:
                        orphaned_in_tryons += 1
                        self.stdout.write(self.style.WARNING(f'      TryOn {tryon["_id"]} references non-existent post {post_id}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'      Error checking post {post_id}: {str(e)}'))
        
        if orphaned_in_tryons == 0:
            self.stdout.write(self.style.SUCCESS('      ✓ No orphaned post references in try-ons'))
        else:
            self.stdout.write(self.style.ERROR(f'      ✗ Found {orphaned_in_tryons} orphaned references'))

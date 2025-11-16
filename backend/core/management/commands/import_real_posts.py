import json
import random
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Post
from PIL import Image

# --- STEP 1: Import the color map from your constants file ---
from core.color_constants import COLOR_SIMPLIFICATION_MAP


class Command(BaseCommand):
    help = 'Loads real posts from annotations.json using real nail images from media/nails/'

    def handle(self, *args, **options):
        # Get the path to the nails media folder
        nails_folder = os.path.join(settings.MEDIA_ROOT, 'nails')
        
        if not os.path.isdir(nails_folder):
            self.stdout.write(self.style.ERROR(
                f"Error: Nails folder not found at {nails_folder}. "
                f"Please ensure nail images are in {nails_folder}"))
            return

        self.stdout.write(self.style.WARNING('Deleting all existing posts...'))
        Post.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('All existing posts deleted.'))

        json_file_path = os.path.join(settings.BASE_DIR, 'data', 'annotations.json')
        self.stdout.write(f"Attempting to load data from: {json_file_path}")

        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Error: File not found at {json_file_path}."))
            return
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR("Error: The JSON file is not formatted correctly."))
            return

        posts_list = data.get('annotations')
        if not posts_list or not isinstance(posts_list, list):
            self.stdout.write(self.style.ERROR("Error: Could not find a list under the 'annotations' key."))
            return

        self.stdout.write(f"Found {len(posts_list)} records. Starting import with real images...")

        posts_created_count = 0
        posts_skipped_count = 0
        
        for post_data in posts_list:
            try:
                image_name = post_data.get('image_name')
                if not image_name:
                    continue

                # Check if the real image file exists
                image_path = os.path.join(nails_folder, image_name)
                if not os.path.isfile(image_path):
                    posts_skipped_count += 1
                    continue

                # Get real image dimensions
                try:
                    with Image.open(image_path) as img:
                        width, height = img.size
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f"Could not read dimensions for {image_name}, using defaults: {e}"))
                    width = 400
                    height = 600

                # Use real image URLs with dynamic base URL from settings
                base_url = getattr(settings, 'MEDIA_BASE_URL', 'http://127.0.0.1:8000')
                image_url = f"{base_url}/media/nails/{image_name}"
                try_on_image_url = f"{base_url}/media/nails/{image_name}"  # Same image for try-on

                shape = post_data.get('shape')
                pattern = post_data.get('pattern')
                size = post_data.get('size')
                colors = post_data.get('colors', [])
                
                title = f"{pattern.title() if pattern else 'Nail'} design with {shape if shape else ''} shape"

                Post.objects.create(
                    image_url=image_url,
                    width=width,
                    height=height,
                    shape=shape,
                    pattern=pattern,
                    size=size,
                    colors=colors,
                    title=title,
                    try_on_image_url=try_on_image_url
                )
                posts_created_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Could not create post for image '{post_data.get('image_name', 'UNKNOWN')}'. Error: {e}"))

        self.stdout.write(
            self.style.SUCCESS(f'Successfully imported {posts_created_count} posts with real images!'))
        if posts_skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Skipped {posts_skipped_count} posts (image files not found).'))

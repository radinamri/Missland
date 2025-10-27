import json
import random
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Post
import os

# --- STEP 1: Import the color map from your constants file ---
from core.color_constants import COLOR_SIMPLIFICATION_MAP


class Command(BaseCommand):
    help = 'Loads real posts from annotations.json with color-coded placeholder images.'

    def handle(self, *args, **options):
        # --- STEP 2: Create the dictionary to map base colors to hex codes ---
        # This is the same map used in your old seed_posts.py script.
        hex_map = {
            'red': 'f87171', 'pink': 'f9a8d4', 'orange': 'fb923c', 'yellow': 'facc15',
            'green': '34d399', 'blue': '60a5fa', 'purple': 'c084fc', 'brown': 'd2b48c',
            'gray': '9ca3af', 'black': '1f2937', 'white': 'f9fafb', 'cream': 'fef3c7', 'turquoise': '2dd4bf'
        }

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

        self.stdout.write(f"Found {len(posts_list)} records. Starting import with color-coding...")

        posts_created_count = 0
        for post_data in posts_list:
            try:
                image_name = post_data.get('image_name')
                if not image_name:
                    continue

                width = 400
                height = random.randint(500, 800)
                colors = post_data.get('colors', [])

                # --- STEP 3: The new color logic ---
                image_color_hex = 'd1d5db'  # Default to gray
                if colors:
                    # Take the first color from the list
                    first_color_variant = colors[0]
                    # Find its base color (e.g., 'sky_blue' -> 'blue')
                    base_color = COLOR_SIMPLIFICATION_MAP.get(first_color_variant, 'gray')
                    # Get the hex code for that base color
                    image_color_hex = hex_map.get(base_color, 'd1d5db')  # Fallback to gray hex

                # --- STEP 4: Use the dynamic hex code in the URL ---
                image_url = f"https://placehold.co/{width}x{height}/{image_color_hex}/FFFFFF?text={image_name.replace('.jpg', '')}"

                shape = post_data.get('shape')
                pattern = post_data.get('pattern')
                size = post_data.get('size')
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
                    try_on_image_url=f"https://placehold.co/{width}x{height}/e5e7eb/374151?text=Try-On"
                )
                posts_created_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Could not create post for image '{post_data.get('image_name', 'UNKNOWN')}'. Error: {e}"))

        self.stdout.write(
            self.style.SUCCESS(f'Successfully imported {posts_created_count} posts with color-coded images!'))

import random
from django.core.management.base import BaseCommand
from core.models import Post


class Command(BaseCommand):
    help = 'Seeds the database with diverse fake posts with color-matched images'

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing posts...")
        Post.objects.all().delete()

        self.stdout.write("Creating new fake posts...")

        # --- Define our categories for realistic data ---
        styles = ['french', 'ombre', 'almond', 'stiletto', 'short', 'long']
        types = ['gel', 'acrylic', 'natural']

        # --- 1. Add your new colors to this dictionary ---
        color_map = {
            'red': 'f87171',
            'blue': '60a5fa',
            'pink': 'f9a8d4',
            'nude': 'f5e0c5',
            'black': '1f2937',
            'white': 'f9fafb',
            'glitter': 'facc15',  # Using gold for glitter
            'green': '34d399',  # New color
            'purple': 'c084fc',  # New color
            'orange': 'fb923c',  # New color
        }
        colors = list(color_map.keys())

        for i in range(40):  # Create 40 fake posts
            # --- 2. Select a color first ---
            selected_color = random.choice(colors)

            # Create a random set of tags for this post
            post_tags = [selected_color, random.choice(styles), random.choice(types)]

            # Create a descriptive title from the tags
            title = f"{post_tags[0].capitalize()} {post_tags[1]} {post_tags[2]} nails"

            # Generate Pinterest-style random dimensions
            width = 400
            height = random.randint(500, 800)

            # --- 3. Use the selected color's hex code in the URL ---
            image_color_hex = color_map[selected_color]

            Post.objects.create(
                title=title,
                image_url=f"https://placehold.co/{width}x{height}/{image_color_hex}/FFFFFF?text={title.replace(' ', '+')}",
                width=width,
                height=height,
                tags=list(set(post_tags))
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with 40 color-matched fake posts.'))

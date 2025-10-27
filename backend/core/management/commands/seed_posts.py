import random
from django.core.management.base import BaseCommand
from core.models import Post
from core.color_constants import COLOR_SIMPLIFICATION_MAP


class Command(BaseCommand):
    help = 'Seeds the database with diverse fake posts using the new data structure.'

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing posts...")
        Post.objects.all().delete()

        self.stdout.write("Creating new fake posts with real data structure...")

        # --- Define our categories for realistic data ---
        shapes = ['almond', 'stiletto', 'square', 'coffin', 'round', 'oval']
        patterns = ['french', 'ombre', 'solid', 'glitter', 'marbled', 'abstract', 'floral', 'gradient', 'glossy']
        sizes = ['short', 'medium', 'long', 'extra_long']

        # Use the detailed color variants from your map as the source
        all_colors = list(COLOR_SIMPLIFICATION_MAP.keys())
        hex_map = {
            'red': 'f87171', 'pink': 'f9a8d4', 'orange': 'fb923c', 'yellow': 'facc15',
            'green': '34d399', 'blue': '60a5fa', 'purple': 'c084fc', 'brown': 'd2b48c',
            'gray': '9ca3af', 'black': '1f2937', 'white': 'f9fafb'
        }

        for i in range(100):  # Create 100 fake posts
            # --- Select attributes for the post ---
            selected_shape = random.choice(shapes)
            selected_pattern = random.choice(patterns)
            selected_size = random.choice(sizes)

            # Select 1 to 3 colors for this post
            num_colors = random.randint(1, 3)
            selected_colors = random.sample(all_colors, num_colors)

            # Create a descriptive title
            title = f"{selected_colors[0].replace('_', ' ').title()} {selected_shape.title()} Nails"
            if selected_pattern != 'solid':
                title = f"{selected_pattern.title()} {title}"

            # Generate Pinterest-style random dimensions
            width = 400
            height = random.randint(500, 800)

            # Use the base color of the first selected color for the placeholder image
            first_color_variant = selected_colors[0]
            base_color = COLOR_SIMPLIFICATION_MAP.get(first_color_variant, 'gray')
            image_color_hex = hex_map.get(base_color, 'd1d5db')

            try_on_image_url = f"https://placehold.co/{width}x{height}/e5e7eb/374151?text=Try-On+Result"

            Post.objects.create(
                title=title,
                image_url=f"https://placehold.co/{width}x{height}/{image_color_hex}/FFFFFF?text={title.replace(' ', '+')}",
                try_on_image_url=try_on_image_url,
                width=width,
                height=height,
                shape=selected_shape,
                pattern=selected_pattern,
                size=selected_size,
                colors=selected_colors  # Save the list of color variants
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with 100 structured fake posts.'))

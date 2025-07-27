import random
from django.core.management.base import BaseCommand
from core.models import Post


class Command(BaseCommand):
    help = 'Seeds the database with diverse fake posts for development'

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing posts...")
        Post.objects.all().delete()

        self.stdout.write("Creating new fake posts...")

        # --- Define our categories for realistic data ---
        colors = ['red', 'blue', 'pink', 'nude', 'black', 'white', 'glitter']
        styles = ['french', 'ombre', 'almond', 'stiletto', 'short', 'long']
        types = ['gel', 'acrylic', 'natural']

        for i in range(40):  # Create 40 fake posts
            # Create a random set of tags for this post
            post_tags = [random.choice(colors), random.choice(styles), random.choice(types)]

            # Create a descriptive title from the tags
            title = f"{post_tags[0].capitalize()} {post_tags[1]} {post_tags[2]} nails"

            # Generate Pinterest-style random dimensions
            width = 400
            height = random.randint(500, 800)

            Post.objects.create(
                title=title,
                image_url=f"https://placehold.co/{width}x{height}/{random.choice(['E9D5FF', 'FBCFE8', 'A5F3FC'])}/4A5568?text={title.replace(' ', '+')}",
                width=width,
                height=height,
                tags=list(set(post_tags))  # Use set to remove duplicate tags
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with 40 fake posts.'))

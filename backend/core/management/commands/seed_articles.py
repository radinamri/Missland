from django.core.management.base import BaseCommand
from django.utils.text import slugify
from core.models import Article


class Command(BaseCommand):
    help = 'Seeds the database with sample articles'

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing articles...")
        Article.objects.all().delete()

        self.stdout.write("Creating sample articles...")

        articles_data = [
            {
                'title': 'The Top 10 Nail Art Trends for Summer 2025',
                'content': 'Discover the hottest colors, from vibrant neons to pastel chromes. This season is all about bold expression and intricate details that make your nails the perfect accessory for any summer outfit.',
                'thumbnail_url': 'https://placehold.co/600x400/fecdd3/4c0519?text=Summer+Nails'
            },
            {
                'title': 'A Beginner\'s Guide to Healthy Hair Care',
                'content': 'Unlock the secrets to shiny, strong, and healthy hair. We cover everything from the right way to wash your hair to the best natural products and dietary tips for promoting growth and preventing damage.',
                'thumbnail_url': 'https://placehold.co/600x400/d8b4fe/581c87?text=Hair+Care'
            },
            {
                'title': 'DIY: How to Achieve the Perfect Gel Manicure at Home',
                'content': 'Save money and get salon-quality results with our step-by-step guide to doing your own gel manicure. We review the essential tools and techniques to ensure a flawless, long-lasting finish every time.',
                'thumbnail_url': 'https://placehold.co/600x400/a5f3fc/083344?text=DIY+Manicure'
            }
        ]

        for data in articles_data:
            Article.objects.create(
                title=data['title'],
                slug=slugify(data['title']),
                content=data['content'],
                thumbnail_url=data['thumbnail_url']
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with sample articles.'))

import json
from django.core.management.base import BaseCommand
from dashboard.models import Annotation


class Command(BaseCommand):
    help = 'Import nail annotations from a JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to the annotations.json file')

    def handle(self, *args, **kwargs):
        file_path = kwargs['json_file']
        self.stdout.write(f"Importing data from {file_path}...")

        with open(file_path, 'r') as f:
            data = json.load(f)
            annotations_data = data.get('annotations', [])

            for item in annotations_data:
                _, created = Annotation.objects.update_or_create(
                    image_name=item['image_name'],
                    defaults={
                        'shape': item.get('shape', ''),
                        'shape_confidence': item.get('shape_confidence', 0.0),
                        'shape_source': item.get('shape_source', ''),
                        'pattern': item.get('pattern', ''),
                        'pattern_confidence': item.get('pattern_confidence', 0.0),
                        'pattern_source': item.get('pattern_source', ''),
                        'colors': item.get('colors', []),
                        'size': item.get('size', ''),
                        'num_nails_detected': item.get('num_nails_detected', 0),
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created: {item['image_name']}"))
                else:
                    self.stdout.write(f"Updated: {item['image_name']}")

        self.stdout.write(self.style.SUCCESS('Successfully imported all annotations.'))

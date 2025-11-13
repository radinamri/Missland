#!/bin/sh
set -e

echo "Starting Django application..."

# Wait for postgres
echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

# Wait for Redis
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis started"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if DJANGO_SUPERUSER_* env vars are set
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py shell << PYTHON_SCRIPT
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
PYTHON_SCRIPT
fi

# Import real posts if requested
if [ "$IMPORT_REAL_POSTS" = "true" ]; then
    echo "Importing real nail design posts..."
    python manage.py import_real_posts || echo "Posts already imported or import failed"
fi

# Seed articles if requested
if [ "$SEED_ARTICLES" = "true" ]; then
    echo "Seeding articles..."
    python manage.py seed_articles || echo "Articles already seeded or seed failed"
fi

echo "Django initialization complete!"

# Execute the main command
exec "$@"

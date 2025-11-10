#!/bin/bash
set -e

echo "=========================================="
echo "Missland Backend - Startup Script"
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z ${POSTGRES_HOST:-postgres} ${POSTGRES_PORT:-5432}; do
  sleep 0.5
done
echo "✅ PostgreSQL is ready!"

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB..."
while ! nc -z mongodb 27017; do
  sleep 0.5
done
echo "✅ MongoDB is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.5
done
echo "✅ Redis is ready!"

echo ""
echo "=========================================="
echo "Running Database Migrations"
echo "=========================================="
python manage.py migrate --noinput

echo ""
echo "=========================================="
echo "Collecting Static Files"
echo "=========================================="
python manage.py collectstatic --noinput --clear

echo ""
echo "=========================================="
echo "Creating MongoDB Indexes"
echo "=========================================="
python manage.py create_mongo_indexes || echo "⚠️  Warning: MongoDB index creation failed or skipped"

echo ""
echo "=========================================="
echo "Startup Complete - Starting Server"
echo "=========================================="
echo "Server mode: $@"
echo "=========================================="
echo ""

# Execute the CMD from Dockerfile
exec "$@"

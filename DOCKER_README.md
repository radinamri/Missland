# Docker Deployment Guide

Complete Docker setup for local development and production deployment.

## 📁 Docker Files Structure

```
Missland/
├── docker-compose.yml          # Base configuration (shared)
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env.example                # Environment template
├── backend/
│   ├── Dockerfile              # Django backend container
│   └── entrypoint.sh           # Startup script (migrations, static files)
├── frontend/
│   └── Dockerfile              # Next.js frontend container
└── nginx/
    ├── Dockerfile              # Nginx reverse proxy
    └── nginx.conf              # Nginx configuration
```

---

## 🚀 Quick Start

### Development (Local)

```bash
# 1. Setup environment
cp .env.example .env
nano .env

# Required for development:
DEBUG=True
SECRET_KEY=your-dev-secret-key
POSTGRES_PASSWORD=dev_password
MONGO_ROOT_PASSWORD=dev_password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

# 2. Start all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 3. Create superuser (in another terminal)
docker-compose exec backend python manage.py createsuperuser

# 4. Access services:
# Frontend:   http://localhost:3000
# Backend:    http://localhost:8000
# Admin:      http://localhost:8000/admin
# PostgreSQL: localhost:5432
# MongoDB:    localhost:27017
# Redis:      localhost:6379
```

### Production

```bash
# 1. Setup environment
cp .env.example .env
nano .env

# Required for production:
DEBUG=False
SECRET_KEY=<generate-strong-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
POSTGRES_PASSWORD=<strong-password>
MONGO_ROOT_PASSWORD=<strong-password>
GOOGLE_CLIENT_ID=<your-id>
GOOGLE_CLIENT_SECRET=<your-secret>
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# 2. Generate Django secret key
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# 3. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Create superuser
docker-compose exec backend python manage.py createsuperuser

# 7. Setup SSL (after DNS points to your server)
docker-compose exec certbot certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email ${SSL_EMAIL} --agree-tos -d ${DOMAIN}

docker-compose restart nginx

# 8. Access: https://yourdomain.com
```

---

## 🗄️ MongoDB Setup & Configuration

### Overview

The application supports both PostgreSQL (default) and MongoDB for data storage. By default, **PostgreSQL is used** and MongoDB integration is disabled.

### Current Configuration

```env
USE_MONGODB=False    # Default: PostgreSQL is primary database
```

### MongoDB Features

When `USE_MONGODB=True`:

- Posts, Collections, and TryOn results stored in MongoDB
- Supports high-volume image metadata and user-generated content
- Synchronous operations via PyMongo (thread-safe driver)
- Automatic indexing for optimized queries
- No async/await complexity - simple, reliable queries

### Setting Up MongoDB

#### 1. Enable MongoDB in Environment

```bash
# Edit .env file
nano .env

# Set MongoDB flag
USE_MONGODB=True

# MongoDB connection settings (already configured by default)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DATABASE=missland_db
MONGO_COLLECTION=nail_images
```

#### 2. Create MongoDB Indexes

After enabling MongoDB, create required indexes for optimal performance:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  python manage.py create_mongo_indexes

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend \
  python manage.py create_mongo_indexes
```

**Note**: Index creation may show warnings about replica sets on standalone instances. These are non-critical and can be safely ignored for development.

#### 3. Migrate Data from PostgreSQL to MongoDB (Optional)

If you have existing data in PostgreSQL and want to migrate to MongoDB:

```bash
# First, ensure you have data in PostgreSQL
docker-compose exec backend python manage.py import_real_posts

# Dry run (preview migration without changes)
docker-compose exec backend python manage.py migrate_to_mongodb --dry-run

# Perform actual migration
docker-compose exec backend python manage.py migrate_to_mongodb --batch-size 100

# Verify migration completed successfully
docker-compose exec backend python manage.py verify_migration
```

**Note**: The migration command uses synchronous PyMongo and processes data in configurable batches for optimal performance.

#### 4. Restart Backend Service

After changing `USE_MONGODB`, restart the backend to apply changes:

```bash
docker-compose restart backend
```

### MongoDB Access

```bash
# Connect to MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <password> --authenticationDatabase admin

# List databases
show dbs

# Use Missland database
use missland_db

# List collections
show collections

# Query posts
db.posts.find().limit(5).pretty()

# Check indexes
db.posts.getIndexes()
```

### Import Initial Data

With MongoDB enabled, import sample nail design posts:

```bash
# Import from backend/data/annotations.json
docker-compose exec backend python manage.py import_real_posts

# Expected output: "Successfully imported 3883 posts"
```

### MongoDB Troubleshooting

#### Connection Refused

```bash
# Check MongoDB is running
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Verify credentials in .env match MongoDB container
docker-compose exec backend env | grep MONGO
```

#### Authentication Failed

```bash
# If you see "Authentication failed" errors:
# This means the admin user wasn't created during initialization

# Connect to MongoDB without auth and create admin user
docker-compose exec mongodb mongosh admin --eval "
  db.createUser({
    user: 'admin',
    pwd: 'mongo_password_123',
    roles: [
      { role: 'root', db: 'admin' },
      { role: 'readWriteAnyDatabase', db: 'admin' }
    ]
  })
"

# Restart backend
docker-compose restart backend
```

#### Index Creation Errors

```bash
# If indexes fail to create, recreate them manually
docker-compose exec backend python manage.py create_mongo_indexes

# Or drop and recreate all indexes
docker-compose exec mongodb mongosh -u admin -p mongo_password_123 \
  --authenticationDatabase admin missland_db \
  --eval "db.posts.dropIndexes(); db.collections.dropIndexes(); db.tryons.dropIndexes();"

docker-compose exec backend python manage.py create_mongo_indexes
```

#### Data Not Appearing

```bash
# Verify USE_MONGODB=True in environment
docker-compose exec backend python manage.py shell

# In Django shell:
from django.conf import settings
print(settings.USE_MONGODB)  # Should show True

# Check MongoDB contains data
docker-compose exec mongodb mongosh -u admin -p <password> \
  --authenticationDatabase admin missland_db \
  --eval "db.posts.countDocuments({})"
```

### MongoDB vs PostgreSQL

| Feature | PostgreSQL (Default) | MongoDB |
|---------|---------------------|---------|
| **Auth & Users** | ✅ Primary | ❌ Not used |
| **Posts & Collections** | ✅ Default | ✅ When enabled |
| **Structured Data** | ✅ Optimal | ⚠️ Acceptable |
| **Unstructured Data** | ⚠️ Acceptable | ✅ Optimal |
| **Transactions** | ✅ Full ACID | ⚠️ Limited |
| **Scaling** | ⬆️ Vertical | ↔️ Horizontal |
| **Driver** | psycopg2 (sync) | PyMongo 4.9 (sync) |
| **Migrations** | ✅ Django ORM | Manual indexing |

**Recommendation**: Keep `USE_MONGODB=False` unless you need MongoDB-specific features like flexible schemas or horizontal scaling.

**Recent Update (Nov 2025)**: MongoDB integration migrated from Motor (async) to PyMongo (sync) for better Django compatibility and simpler codebase. No more async/await complexity!

---

## 🏗️ Services Architecture

| Service | Port | Purpose | Exposed (Dev) | Exposed (Prod) |
|---------|------|---------|---------------|----------------|
| **Nginx** | 80, 443 | Reverse proxy + SSL | 80, 443 | 80, 443 |
| **Frontend** | 3000 | Next.js app | 3000 | - |
| **Backend** | 8000 | Django API + WebSocket | 8000 | - |
| **PostgreSQL** | 5432 | Primary database | 5432 | - |
| **MongoDB** | 27017 | Document storage | 27017 | - |
| **Redis** | 6379 | WebSocket channel layer | 6379 | - |
| **Certbot** | - | SSL certificate renewal | - | - |

**Development**: All ports exposed for direct access  
**Production**: Only Nginx ports exposed (services accessed via reverse proxy)

---

## 🔧 Common Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up        # Development
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d    # Production

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f backend frontend   # Specific services
docker-compose logs --tail=100 backend    # Last 100 lines

# Check service status
docker-compose ps

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations

```bash
# Django migrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py makemigrations

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# PostgreSQL shell
docker-compose exec postgres psql -U missland_user -d missland_db

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p <password> --authenticationDatabase admin

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U missland_user missland_db > backup_$(date +%Y%m%d).sql

# Restore PostgreSQL
cat backup_20250109.sql | docker-compose exec -T postgres psql -U missland_user missland_db

# Backup MongoDB
docker-compose exec mongodb mongodump -u admin -p <password> --authenticationDatabase admin --out /data/backup

# MongoDB migration (PostgreSQL → MongoDB)
docker-compose exec backend python manage.py migrate_to_mongodb --dry-run
docker-compose exec backend python manage.py migrate_to_mongodb
docker-compose exec backend python manage.py verify_migration
```

### Maintenance

```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create MongoDB indexes
docker-compose exec backend python manage.py create_mongo_indexes

# Import data
docker-compose exec backend python manage.py import_real_posts

# Update application
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Clean up
docker-compose down -v              # Remove containers and volumes
docker system prune -a              # Clean unused Docker resources
```

---

## ⚙️ Environment Configuration

### Required Variables

```env
# Django
SECRET_KEY=                         # Generate with Django command
DEBUG=False                         # True for dev, False for prod
ALLOWED_HOSTS=localhost,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# PostgreSQL
POSTGRES_DB=missland_db
POSTGRES_USER=missland_user
POSTGRES_PASSWORD=                  # Set strong password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=                # Set strong password
MONGO_DATABASE=missland_db
MONGO_COLLECTION=nail_images
USE_MONGODB=False                   # Set True after migration

# Redis
REDIS_URL=redis://redis:6379/0

# Google OAuth
GOOGLE_CLIENT_ID=                   # From Google Cloud Console
GOOGLE_CLIENT_SECRET=               # From Google Cloud Console

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost/api

# Production SSL
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com
```

See `.env.example` for complete list with descriptions.

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check entrypoint permissions
chmod +x backend/entrypoint.sh

# View backend logs
docker-compose logs backend

# Check database connections
docker-compose exec backend env | grep POSTGRES
docker-compose exec backend env | grep MONGO

# Rebuild backend
docker-compose up -d --build backend
```

### Database Connection Errors

```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Check MongoDB replica set
docker-compose exec mongodb mongosh -u admin -p password \
  --authenticationDatabase admin --eval "rs.status()"

# Check Redis
docker-compose exec redis redis-cli ping
```

### Frontend Build Fails

```bash
# Clear and rebuild
docker-compose down frontend
docker-compose up -d --build frontend
docker-compose logs -f frontend
```

### WebSocket Not Working

```bash
# Verify Daphne is running (not Gunicorn)
docker-compose exec backend ps aux | grep daphne

# Check nginx WebSocket configuration
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 10 "location /ws/"

# Test WebSocket endpoint
docker-compose logs -f backend | grep -i websocket
```

### SSL Certificate Issues

```bash
# Check certificate files
docker-compose exec nginx ls -la /etc/nginx/ssl/

# Renew certificate
docker-compose exec certbot certbot renew --force-renewal
docker-compose restart nginx

# Check nginx configuration
docker-compose exec nginx nginx -t
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :3000

# Stop conflicting service or change port in docker-compose
```

---

## 🔒 Production Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate unique `SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set `CORS_ALLOWED_ORIGINS` with your domain
- [ ] Use strong passwords for PostgreSQL and MongoDB
- [ ] Configure SSL/TLS with Let's Encrypt
- [ ] Set up firewall rules (allow only 80, 443)
- [ ] Regular backups configured
- [ ] Update dependencies regularly
- [ ] Never commit `.env` file to Git

---

## 📊 Service Health Checks

All services include health checks for reliable orchestration:

```bash
# Check health status
docker-compose ps

# Expected output:
# postgres    healthy
# mongodb     healthy  
# redis       healthy
# backend     healthy
# frontend    healthy
# nginx       healthy
```

If a service shows unhealthy:

```bash
# View health check logs
docker inspect --format='{{json .State.Health}}' nail_dashboard_backend | jq

# Check service logs
docker-compose logs <service-name>
```

---

## 🎯 What Happens on Startup

**entrypoint.sh** automatically:

1. ✅ Waits for PostgreSQL, MongoDB, and Redis to be ready
2. ✅ Runs Django database migrations
3. ✅ Collects static files
4. ✅ Creates MongoDB indexes
5. ✅ Starts Daphne ASGI server

This ensures the application is fully initialized and ready to serve requests.

---

## 📚 Additional Resources

- **Main README**: [README.md](README.md)
- **Environment Template**: [.env.example](.env.example)
- **Backend Structure**: [docs/Tryon/BACKEND_STRUCTURE.md](docs/Tryon/BACKEND_STRUCTURE.md)
- **MongoDB Migration**: [docs/Mongo/MONGODB_MIGRATION_SUMMARY.md](docs/Mongo/MONGODB_MIGRATION_SUMMARY.md)

---

**For issues not covered here, check service logs**: `docker-compose logs -f`

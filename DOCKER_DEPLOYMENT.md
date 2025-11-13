# Missland - Docker Deployment Guide

Complete Docker Compose deployment for Missland nail design platform with automated initialization.

## Quick Start

```bash
# Clone repository
git clone <your-repo-url>
cd Missland

# Configure environment
cp .env.docker .env
# Edit .env with your values

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access application
http://46.249.102.155
```

## Architecture

**5-Service Docker Stack:**
- **PostgreSQL 16**: Database with persistent volume
- **Redis 7**: Caching layer
- **Django 5.2.8**: API server (Gunicorn + 4 workers)
- **Next.js 15.5.0**: Frontend (standalone build)
- **Nginx**: Reverse proxy for routing

## Automated Initialization

First run automatically:
1. Runs database migrations
2. Creates superuser (from env vars)
3. Imports 3,883 nail design posts
4. Seeds blog articles
5. Collects static files

## Environment Variables

Copy `.env.docker` to `.env` and configure:

### Critical Settings
```bash
SECRET_KEY=generate-secure-key
DB_PASSWORD=secure-password
DJANGO_SUPERUSER_PASSWORD=admin-password
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-secret
```

### Server Configuration
```bash
ALLOWED_HOSTS=46.249.102.155
CORS_ALLOWED_ORIGINS=http://46.249.102.155
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
```

### Data Initialization
```bash
IMPORT_REAL_POSTS=true  # Load nail designs
SEED_ARTICLES=true      # Load blog content
```

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View service logs
docker-compose logs -f django
docker-compose logs -f nextjs

# Run Django management commands
docker-compose exec django python manage.py <command>

# Access Django shell
docker-compose exec django python manage.py shell

# Create additional superuser
docker-compose exec django python manage.py createsuperuser

# Access database
docker-compose exec postgres psql -U postgres -d missland_db

# Clean restart (removes volumes)
docker-compose down -v
docker-compose up -d --build
```

## File Structure

```
Missland/
├── docker-compose.yml           # Main orchestration file
├── Dockerfile.django            # Django container
├── Dockerfile.nextjs            # Next.js container
├── .dockerignore                # Build optimization
├── .env.docker                  # Environment template
├── scripts/
│   ├── entrypoint-django.sh     # Django initialization
│   └── entrypoint-nextjs.sh     # Next.js initialization
├── nginx/
│   └── nginx.conf               # Reverse proxy config
├── backend/                     # Django source
└── frontend/                    # Next.js source
```

## Ports

- **80**: Nginx (main access point)
- **8000**: Django API (internal)
- **3000**: Next.js (internal)
- **5432**: PostgreSQL (exposed for debugging)
- **6379**: Redis (exposed for debugging)

## Volumes

Persistent data storage:
- `postgres_data`: Database
- `redis_data`: Cache
- `static_volume`: Django static files
- `media_volume`: Uploaded images (3,883 nail designs)

## Health Checks

All services have health monitoring:
```bash
# Check service health
docker-compose ps

# Nginx health endpoint
curl http://46.249.102.155/health
```

## Troubleshooting

### Services won't start
```bash
docker-compose logs <service-name>
docker-compose down
docker-compose up -d --build
```

### Database connection issues
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready

# Verify environment
docker-compose exec django env | grep DB_
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
# Will reinitialize with fresh data
```

### Permission issues
```bash
# Django runs as user 'appuser' (UID 1000)
# Next.js runs as user 'nextjs' (UID 1001)
sudo chown -R 1000:1000 backend/media
sudo chown -R 1000:1000 backend/staticfiles
```

## Production Deployment

### On Server (46.249.102.155)

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone <your-repo-url>
cd Missland
cp .env.docker .env
nano .env  # Configure production values

# Start services
docker-compose up -d

# Monitor deployment
docker-compose logs -f
```

### Post-Deployment

1. Access admin panel: `http://46.249.102.155/admin`
2. Login with superuser credentials from `.env`
3. Verify 3,883 nail designs loaded
4. Check blog articles populated
5. Test Google OAuth login

## Security Notes

- Running on HTTP only (IP: 46.249.102.155)
- For SSL, add domain and update Nginx config
- Change all default passwords in `.env`
- Never commit `.env` to git
- Google OAuth configured for production

## Monitoring

```bash
# Resource usage
docker stats

# Container status
docker-compose ps

# View all logs
docker-compose logs --tail=100 -f

# Disk usage
docker system df
```

## Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# No downtime update (rolling)
docker-compose up -d --no-deps --build django
docker-compose up -d --no-deps --build nextjs
```

## Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres missland_db > backup.sql

# Backup media files
tar -czf media_backup.tar.gz backend/media/

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres missland_db
```

## Tech Stack

- **Backend**: Django 5.2.8, DRF 3.16.1, django-allauth 65.13.0
- **Frontend**: Next.js 15.5.0, React 19.1.0, TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Server**: Gunicorn 23.0.0 (4 workers)
- **Proxy**: Nginx (alpine)

## Support

Admin panel: `http://46.249.102.155/admin`
API docs: `http://46.249.102.155/api/`
Frontend: `http://46.249.102.155`

---

**Ready for GitHub** ✓ | **Production Tested** ✓ | **Auto-Initialized** ✓

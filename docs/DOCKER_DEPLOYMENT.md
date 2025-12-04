# Missland Production Deployment Guide

Complete Docker Compose deployment guide for Missland nail design platform.

**Server**: 46.249.102.155 | **Status**: ✅ Production Running | **Auto-Initialized**: ✅

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Common Commands](#common-commands)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Backup & Recovery](#backup--recovery)

---

## Quick Start

```bash
# SSH to production server
ssh root@46.249.102.155

# Navigate to project
cd ~/Missland

# Pull latest code
git pull origin main

# Configure environment (first deployment only)
cp .env.docker.example .env.docker
nano .env.docker
# Update production secrets (SECRET_KEY, DB_PASSWORD, OAUTH credentials)

# Deploy
docker-compose up -d

# Verify
docker-compose ps
curl http://46.249.102.155/api/health/
```

Visit: **http://46.249.102.155** ✅

---

## Prerequisites

- Clean Ubuntu server with SSH access
- Docker and Docker Compose installed
- Git installed
- Domain name (optional, currently using IP: 46.249.102.155)

### Server Setup

If Docker not installed:

```bash
# SSH to server
ssh root@46.249.102.155

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
apt update && apt install -y git
```

---

## Architecture

### 5-Service Docker Stack

```
┌─────────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)             │
│                    Port 80 / Port 443                │
└────────────────┬──────────────────┬──────────────────┘
                 │                  │
         ┌───────▼────────┐  ┌──────▼────────┐
         │  Django API    │  │  Next.js      │
         │ (Gunicorn)     │  │  Frontend     │
         │  Port 8000     │  │  Port 3000    │
         └────────┬────────┘  └───────────────┘
                  │
         ┌────────▼──────────┐
         │  PostgreSQL 16    │
         │  Redis 7 Cache    │
         │  Port 5432/6379   │
         └───────────────────┘
```

**Services:**
- **PostgreSQL 16**: Database with persistent volume (postgres_data)
- **Redis 7**: Caching layer with persistent volume (redis_data)
- **Django 5.2.8**: API server (Gunicorn + 4 workers)
- **Next.js 15.0.3**: Frontend (standalone build)
- **Nginx**: Reverse proxy for routing and static files

**Volumes:**
- `postgres_data`: Database persistence
- `redis_data`: Cache persistence
- `static_volume`: Django static files
- `media_volume`: Uploaded images (3,883 nail designs)

---

## Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.docker.example .env.docker
```

### Step 2: Configure .env.docker

Key variables to update from `.env.docker.example`:

```bash
# REQUIRED: Generate strong random value (50+ characters)
SECRET_KEY=<generate-new-secure-key>

# REQUIRED: Strong database password
DB_PASSWORD=<secure-random-password>

# REQUIRED: Admin panel password
DJANGO_SUPERUSER_PASSWORD=<secure-admin-password>

# OPTIONAL: If adding AI chat features
OPENAI_API_KEY=<your-api-key>

# ⚠️ DO NOT CHANGE (already configured for 46.249.102.155)
ALLOWED_HOSTS=46.249.102.155,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://46.249.102.155
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
BASE_URL=http://46.249.102.155

# ✅ Google OAuth (already configured - do not change)
GOOGLE_OAUTH_CLIENT_ID=665407123210-20j9tne8tqgfi5t7dn6jr6taj51o0elk.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
```

**Important: Never commit `.env.docker` to Git** - It contains secrets and is in `.gitignore`

### Generate Secret Key

```bash
# Option 1: Using Django
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Option 2: Using Python
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Option 3: Online generator
# https://djecrety.ir/
```

---

## Deployment Steps

### Step 1: Clone Repository

```bash
ssh root@46.249.102.155
cd ~
git clone https://github.com/radinamri/Missland.git
cd Missland
```

### Step 2: Configure Environment

```bash
cp .env.docker.example .env.docker
nano .env.docker
# Edit production secrets
```

### Step 3: Build and Start Services

```bash
# Build images
docker-compose build --no-cache

# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Verify all services are healthy
docker-compose ps
```

### Step 4: Wait for Initialization

First run automatically:
1. ✅ Runs database migrations
2. ✅ Creates superuser (from env vars)
3. ✅ Imports 3,883 nail design posts
4. ✅ Seeds 12 blog articles
5. ✅ Collects static files

Wait ~30-60 seconds for all services to become "healthy" status.

---

## Post-Deployment Verification

### 1. Check Service Health

```bash
docker-compose ps
# All containers should show: healthy or Up
```

### 2. Test API Endpoint

```bash
curl http://46.249.102.155/api/health/
# Should return: {"status":"ok"}
```

### 3. Access Frontend

```bash
# Visit in browser
http://46.249.102.155
```

### 4. Access Admin Panel

```bash
# Visit in browser
http://46.249.102.155/admin

# Login with credentials from .env.docker:
# Username: DJANGO_SUPERUSER_USERNAME
# Password: DJANGO_SUPERUSER_PASSWORD
```

### 5. Verify Data

```bash
# Check posts loaded
docker-compose exec django python manage.py shell
>>> from core.models import Post
>>> Post.objects.count()
# Should show: 3883
```

---

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services (keeps data)
docker-compose down

# Stop all services and remove volumes (⚠️ deletes data!)
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart django
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f django
docker-compose logs -f nextjs
docker-compose logs -f nginx
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 -f

# View logs with timestamps
docker-compose logs -f --timestamps
```

### Django Management Commands

```bash
# Run migrations
docker-compose exec django python manage.py migrate

# Create additional superuser
docker-compose exec django python manage.py createsuperuser

# Import nail designs
docker-compose exec django python manage.py import_real_posts

# Seed blog articles
docker-compose exec django python manage.py seed_articles

# Access Django shell
docker-compose exec django python manage.py shell

# Run static file collection
docker-compose exec django python manage.py collectstatic --noinput
```

### Database Access

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d missland_db

# Useful psql commands:
# \dt              # List tables
# \d core_post     # Describe table
# SELECT COUNT(*) FROM core_post;  # Count records
# \q               # Exit
```

### Container Interaction

```bash
# Shell into Django container
docker-compose exec django bash

# Shell into Next.js container
docker-compose exec nextjs bash

# Shell into PostgreSQL container
docker-compose exec postgres bash

# Run arbitrary command in container
docker-compose exec django python --version
```

---

## Troubleshooting

### Issue: Services Won't Start

**Error**: `docker-compose up -d` fails or services not becoming healthy

**Solution**:

```bash
# Check logs for errors
docker-compose logs

# Stop and clean up
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# Start again
docker-compose up -d

# Monitor startup
docker-compose logs -f
```

### Issue: Database Connection Failed

**Error**: Django can't connect to PostgreSQL

**Solution**:

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection from Django
docker-compose exec django python manage.py dbshell

# If still failing, restart PostgreSQL
docker-compose restart postgres
docker-compose logs -f postgres
```

### Issue: Port Already in Use

**Error**: `bind: address already in use`

**Solution**:

```bash
# Find process using port 80
sudo lsof -i :80
sudo lsof -i :443

# Kill process
sudo kill -9 <PID>

# Or modify docker-compose.yml to use different port
# Change: - "80:80"
# To:     - "8080:80"
```

### Issue: Nginx Returns 502 Bad Gateway

**Cause**: Django not running or not responding

**Solution**:

```bash
# Check Django logs
docker-compose logs django

# Restart Django
docker-compose restart django

# Check if Django is listening
docker-compose exec django python manage.py runserver

# If needed, rebuild Django
docker-compose up -d --build django
```

### Issue: Static Files Not Showing (404 errors)

**Error**: CSS, JS, images return 404

**Solution**:

```bash
# Collect static files
docker-compose exec django python manage.py collectstatic --noinput

# Restart Nginx
docker-compose restart nginx

# Verify static volume mounted
docker-compose exec nginx ls /app/staticfiles/
```

### Issue: Media Files Not Accessible

**Error**: Images return 404

**Solution**:

```bash
# Check media volume
docker-compose exec django ls /app/media/nails/ | head

# Verify Nginx can access
docker-compose exec nginx ls /app/media/nails/ | head

# Restart services
docker-compose restart django nginx
```

### Issue: Out of Disk Space

**Error**: `no space left on device`

**Solution**:

```bash
# Check disk usage
df -h

# Clean up Docker unused resources
docker system prune -a --volumes

# Check Docker disk usage
docker system df

# Remove specific unused items
docker container prune -f
docker image prune -a -f
docker volume prune -f
```

---

## Monitoring & Maintenance

### Health Checks

All services have built-in health monitoring. Check regularly:

```bash
# Quick status
docker-compose ps

# Detailed health check endpoint
curl http://46.249.102.155/api/health/

# Resource usage
docker stats
```

### Resource Monitoring

```bash
# Check CPU, memory, network usage
docker stats

# Check disk space
df -h

# Check Docker usage
docker system df
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Edit daemon.json
sudo nano /etc/docker/daemon.json

# Add logging configuration:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

### Updates and Patching

```bash
# Pull latest code from GitHub
cd ~/Missland
git pull origin main

# Rebuild and restart with zero downtime
docker-compose up -d --build

# Or rolling restart for specific services
docker-compose up -d --no-deps --build django
docker-compose up -d --no-deps --build nextjs
```

---

## Backup & Recovery

### Backup Database

```bash
# Backup to file
docker-compose exec postgres pg_dump -U postgres missland_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup to compressed file
docker-compose exec postgres pg_dump -U postgres missland_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Copy to local machine
scp root@46.249.102.155:~/backup_*.sql.gz ./
```

### Restore Database

```bash
# From local file
cat backup.sql | docker-compose exec -T postgres psql -U postgres missland_db

# From compressed file
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres missland_db
```

### Backup Media Files

```bash
# Backup media volume
docker run --rm -v missland_media_volume:/media -v ~/backups:/backup \
  alpine tar -czf /backup/media_backup_$(date +%Y%m%d).tar.gz -C /media .

# Copy to local machine
scp root@46.249.102.155:~/backups/media_backup_*.tar.gz ./
```

### Restore Media Files

```bash
# If media volume needs to be recreated
docker volume create missland_media_volume

# Restore from backup
docker run --rm -v missland_media_volume:/media -v ~/backups:/backup \
  alpine tar -xzf /backup/media_backup.tar.gz -C /media
```

### Full System Backup

```bash
# Backup everything (code, database, media)
mkdir -p ~/backups
cd ~/Missland

# Backup database
docker-compose exec postgres pg_dump -U postgres missland_db | gzip > ~/backups/db_backup_$(date +%Y%m%d).sql.gz

# Backup media volume
docker run --rm -v missland_media_volume:/media -v ~/backups:/backup \
  alpine tar -czf /backup/media_backup_$(date +%Y%m%d).tar.gz -C /media .

# Backup .env.docker (keep safe!)
cp .env.docker ~/backups/.env.docker.backup_$(date +%Y%m%d)

# Copy all to local machine
scp -r root@46.249.102.155:~/backups ./backups_$(date +%Y%m%d)
```

---

## File Structure

```
Missland/
├── docker-compose.yml           # Service orchestration
├── Dockerfile.django            # Django image definition
├── Dockerfile.nextjs            # Next.js image definition
├── .dockerignore                # Files excluded from build
├── .env.docker                  # Production config (⚠️ git-ignored, secrets)
├── .env.docker.example          # Template (✅ tracked in Git)
├── scripts/
│   ├── entrypoint-django.sh     # Django container startup
│   └── entrypoint-nextjs.sh     # Next.js container startup
├── nginx/
│   └── missland.conf            # Nginx reverse proxy config
├── deployment/                  # Deployment utilities
│   ├── health-check.sh
│   ├── setup.sh
│   ├── nginx/
│   └── systemd/
├── backend/                     # Django source code
│   ├── config/                  # Django settings
│   ├── core/                    # Main app
│   ├── manage.py
│   ├── requirements.txt
│   └── media/                   # Uploaded files (3,883 nail images)
├── frontend/                    # Next.js source code
│   ├── app/                     # Pages
│   ├── components/              # React components
│   ├── package.json
│   └── public/                  # Static assets
└── README.md                    # Overview
```

---

## Security Best Practices

1. **Environment Security**
   - ✅ `.env.docker` is git-ignored (never committed)
   - ✅ `.env.docker.example` is tracked (safe to commit)
   - ✅ Use strong, random `SECRET_KEY` (50+ characters)
   - ✅ Use strong `DB_PASSWORD` (20+ characters, special chars)

2. **Access Control**
   - ⚠️ Currently HTTP only (no SSL/TLS)
   - ⚠️ No domain configured (using IP: 46.249.102.155)
   - 💡 To add SSL: Purchase domain, update Nginx config, install certificate

3. **Container Security**
   - Django runs as non-root user `appuser` (UID 1000)
   - Next.js runs as non-root user `nextjs` (UID 1001)
   - PostgreSQL runs as non-root user `postgres`

4. **Data Protection**
   - Regular backups recommended (daily)
   - Keep backups in secure location
   - Test restore procedures periodically

---

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Django | 5.2.8 | Backend API framework |
| DRF | 3.16.1 | REST API serializers |
| Django-allauth | 65.13.0 | Authentication & OAuth |
| PostgreSQL | 16-alpine | Database |
| Redis | 7-alpine | Caching |
| Gunicorn | 23.0.0 | WSGI application server |
| Next.js | 15.0.3 | Frontend framework |
| React | 19 | UI library |
| Nginx | latest-alpine | Reverse proxy |

---

## Support & Resources

### Admin Access
- **URL**: http://46.249.102.155/admin
- **Username**: From `DJANGO_SUPERUSER_USERNAME` in `.env.docker`
- **Password**: From `DJANGO_SUPERUSER_PASSWORD` in `.env.docker`

### API Documentation
- **URL**: http://46.249.102.155/api/
- **Health Check**: http://46.249.102.155/api/health/

### Frontend
- **URL**: http://46.249.102.155

### Useful Links
- Django Admin: http://46.249.102.155/admin
- API Health: http://46.249.102.155/api/health/
- API Posts: http://46.249.102.155/api/auth/posts/

---

## Deployment Checklist

- [ ] Server prerequisites installed (Docker, Docker Compose, Git)
- [ ] Repository cloned to `~/Missland`
- [ ] `.env.docker` created from `.env.docker.example`
- [ ] Production secrets configured in `.env.docker`
- [ ] Images built successfully
- [ ] All services running and healthy
- [ ] Database migrations completed
- [ ] Superuser created
- [ ] Data imported (3,883 posts, 12 articles)
- [ ] Frontend accessible at http://46.249.102.155
- [ ] Admin panel accessible with credentials
- [ ] API health endpoint responds
- [ ] Backups configured and tested

---

**Production Status**: ✅ Running on 46.249.102.155
**Last Updated**: December 4, 2025
**Auto-Initialization**: ✅ Enabled

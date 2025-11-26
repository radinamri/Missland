# Missland Production Deployment Guide

Server IP: **46.249.102.155**

## Prerequisites

- Clean Ubuntu server with Docker and Docker Compose installed
- SSH access as root
- Git installed
- Media backup file (if redeploying)

## Step 1: Server Preparation

SSH into the server:
```bash
ssh root@46.249.102.155
```

Install required packages (if not already installed):
```bash
apt update
apt install -y git docker.io docker-compose-v2
systemctl enable docker
systemctl start docker
```

## Step 2: Clone Repository

```bash
cd ~
git clone https://github.com/radinamri/Missland.git
cd Missland
```

## Step 3: Configure Environment Variables

Create `.env.docker` file from the example:
```bash
cp .env.docker.example .env.docker
nano .env.docker
```

**Required changes in `.env.docker`:**
- `SECRET_KEY`: Generate a secure 50+ character random string
- `DB_PASSWORD`: Set a strong database password
- `DJANGO_SUPERUSER_PASSWORD`: Set admin panel password
- `OPENAI_API_KEY`: (Optional) Add your OpenAI API key for AI chat feature

Keep the following as-is:
- `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` (already configured)
- `NEXT_PUBLIC_API_URL=http://46.249.102.155/api`
- `ALLOWED_HOSTS=46.249.102.155,localhost,127.0.0.1`

## Step 4: Restore Media Files (If Redeploying)

If you have a backup of media files:

```bash
# Create media volume first
docker volume create missland_media_volume

# Restore from backup
docker run --rm -v missland_media_volume:/media -v /tmp:/backup alpine \
  tar -xzf /backup/missland_media_backup.tar.gz -C /media

# Verify restoration
docker run --rm -v missland_media_volume:/media alpine ls -la /media/nails | head -20
```

## Step 5: Deploy Application

Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:
```bash
docker-compose --env-file .env.docker build --no-cache
docker-compose --env-file .env.docker up -d
```

## Step 6: Verify Deployment

Wait 30 seconds for all services to start, then check:

```bash
docker-compose ps
```

All containers should show "healthy" status:
- `missland_postgres` - healthy
- `missland_redis` - healthy  
- `missland_django` - healthy
- `missland_nextjs` - healthy
- `missland_nginx` - healthy

## Step 7: Test Application

1. **Visit**: http://46.249.102.155
2. **Test API**: `curl http://46.249.102.155/api/health/`
3. **Admin Panel**: http://46.249.102.155/admin/
   - Username: Value from `DJANGO_SUPERUSER_USERNAME` in `.env.docker`
   - Password: Value from `DJANGO_SUPERUSER_PASSWORD` in `.env.docker`

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f django
docker-compose logs -f nextjs
docker-compose logs -f nginx
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart django
```

### Stop All Services
```bash
docker-compose down
```

### Update Application
```bash
cd ~/Missland
git pull origin main
./deploy.sh
```

### Database Operations
```bash
# Run migrations
docker-compose exec django python manage.py migrate

# Create superuser manually
docker-compose exec django python manage.py createsuperuser

# Import nail posts
docker-compose exec django python manage.py import_real_posts

# Seed articles
docker-compose exec django python manage.py seed_articles
```

### Backup Media Files
```bash
docker run --rm -v missland_media_volume:/media -v /tmp:/backup alpine \
  tar -czf /backup/missland_media_backup_$(date +%Y%m%d).tar.gz -C /media .
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres missland_db > /tmp/missland_db_backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Container Not Starting
```bash
# Check logs
docker-compose logs django

# Check if ports are in use
netstat -tulpn | grep -E '80|8000|3000|5432|6379'
```

### Django Errors
```bash
# Shell into Django container
docker-compose exec django bash

# Check Python packages
pip list

# Test database connection
python manage.py dbshell
```

### Next.js Not Building
```bash
# Rebuild without cache
docker-compose build --no-cache nextjs
docker-compose up -d nextjs
```

### Clear Everything and Restart
```bash
docker-compose down
docker system prune -a --volumes  # ⚠️ This deletes everything!
cd ~/Missland
git pull origin main
./deploy.sh
```

## Security Notes

- ⚠️ **Never commit `.env.docker`** - it contains secrets
- Change default passwords immediately after first deployment
- Keep `SECRET_KEY` secure and random (50+ characters)
- Regularly backup database and media files
- Monitor logs for suspicious activity

## Performance Optimization

Current configuration:
- Gunicorn: 4 workers
- PostgreSQL: 16-alpine
- Redis: 7-alpine  
- Nginx: alpine (reverse proxy + static files)

To increase workers for high traffic:
```bash
# Edit docker-compose.yml or Dockerfile.django
# Change: --workers 4 to --workers 8
```

## Project Structure

```
Missland/
├── backend/              # Django backend (in Docker)
├── frontend/             # Next.js frontend (in Docker)
├── nginx/               # Nginx config
├── scripts/             # Entrypoint scripts
├── docker-compose.yml   # Service orchestration
├── Dockerfile.django    # Django image
├── Dockerfile.nextjs    # Next.js image
├── deploy.sh           # Deployment script
└── .env.docker         # Environment variables (NOT in Git)
```

## Support

For issues or questions:
1. Check Docker logs: `docker-compose logs -f`
2. Verify environment variables in `.env.docker`
3. Ensure all containers are healthy: `docker-compose ps`
4. Review this guide's troubleshooting section

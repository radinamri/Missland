# Docker Deployment Guide

Complete guide for deploying the Nail Annotation Dashboard on a Linux server with Docker, including HTTPS/SSL setup.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker Engine 20.10+ and Docker Compose 2.0+
- Domain name pointed to your server (for HTTPS)
- At least 2GB RAM and 10GB disk space
- Open ports: 80 (HTTP), 443 (HTTPS)

## Quick Start

### 1. Install Docker (if not already installed)

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Clone and Configure

```bash
# Navigate to your project directory
cd /home/psyborg/Desktop/Git/GitHub/nail_annotation_dashboard

# Create environment file from example
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Changes in `.env`:**

1. **MongoDB Password**: Change `MONGO_ROOT_PASSWORD` to a strong password
2. **Django Secret Key**: Generate new key:
   ```bash
   python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   ```
   Copy output to `SECRET_KEY`
3. **Domain**: Set `ALLOWED_HOSTS` and `DOMAIN` to your domain name
4. **CORS**: Update `CORS_ALLOWED_ORIGINS` to `https://yourdomain.com`
5. **Frontend API**: Set `NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api`
6. **Image Path**: Set `NAIL_IMAGES_PATH` to your nail images directory
7. **SSL Email**: Set `SSL_EMAIL` to your email for Let's Encrypt

### 3. Prepare Data Files

```bash
# Ensure annotations.json exists in backend directory
ls -lh backend/annotations.json

# Verify nail images path exists
ls -lh /path/to/your/nail_images/

# Create necessary directories
mkdir -p nginx/ssl nginx/certbot/www nginx/certbot/conf
```

### 4. Build and Start Services

```bash
# Build Docker images (first time or after code changes)
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

### 5. Setup SSL/HTTPS with Let's Encrypt

**Initial Setup (First Time):**

```bash
# Stop nginx temporarily
docker compose stop nginx

# Obtain SSL certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN}

# Copy certificates to nginx ssl directory
sudo cp nginx/certbot/conf/live/${DOMAIN}/fullchain.pem nginx/ssl/cert.pem
sudo cp nginx/certbot/conf/live/${DOMAIN}/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker compose start nginx
```

**Alternative: Use Docker exec after services are running:**

```bash
# Request certificate (services must be running)
docker compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com

# Copy certificates
docker compose exec nginx cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/cert.pem
docker compose exec nginx cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/key.pem

# Reload nginx
docker compose exec nginx nginx -s reload
```

**Certificate Auto-Renewal:**
- Certbot container automatically renews certificates every 12 hours
- Certificates renew 30 days before expiration

### 6. Initialize Database

```bash
# Create Django superuser for admin access
docker compose exec backend python manage.py createsuperuser

# Follow prompts to create admin user
```

**Data Import (Automatic on First Run):**
- The system automatically checks if MongoDB is empty on startup
- If empty, it imports data from `backend/annotations.json`
- No manual intervention needed for initial import

**Manual Data Import (if needed):**

```bash
# Import annotations manually
docker compose exec backend python manage.py import_annotations /app/annotations.json
```

### 7. Verify Deployment

Visit your domain in a browser:
- **Frontend**: `https://yourdomain.com`
- **Backend API**: `https://yourdomain.com/api/v1/annotations/`
- **Django Admin**: `https://yourdomain.com/admin/`

Check SSL certificate:
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Nginx (Port 80/443)             │
│    Reverse Proxy + SSL Termination      │
└──────────┬──────────────┬───────────────┘
           │              │
           │              │
┌──────────▼──────────┐  │  ┌──────────────┐
│   Frontend          │  │  │   Backend    │
│   (Next.js:3000)    │  │  │ (Django:8000)│
└─────────────────────┘  │  └──────┬───────┘
                         │         │
                ┌────────▼─────────▼───────┐
                │   MongoDB (27017)        │
                │   + SQLite (auth)        │
                └──────────────────────────┘
```

**Services:**
- `mongodb`: Data storage for nail annotations
- `backend`: Django REST API
- `frontend`: Next.js web application
- `nginx`: Reverse proxy with SSL/TLS
- `certbot`: SSL certificate management

**Volumes:**
- `mongodb_data`: Persistent MongoDB database
- `static_volume`: Django static files
- `backend/db.sqlite3`: Django authentication database
- `backend/media`: Uploaded media files
- `${NAIL_IMAGES_PATH}`: Read-only nail images from host

## Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f mongodb
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart nginx
```

### Stop Services

```bash
# Stop all
docker compose stop

# Stop specific service
docker compose stop frontend
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Run migrations if needed
docker compose exec backend python manage.py migrate
```

### Database Backup

```bash
# Backup MongoDB
docker compose exec mongodb mongodump \
  --username=${MONGO_ROOT_USERNAME} \
  --password=${MONGO_ROOT_PASSWORD} \
  --out=/data/backup

# Copy backup to host
docker cp nail_dashboard_mongodb:/data/backup ./mongodb_backup_$(date +%Y%m%d)

# Backup SQLite
docker cp nail_dashboard_backend:/app/db.sqlite3 ./db_backup_$(date +%Y%m%d).sqlite3
```

### Database Restore

```bash
# Restore MongoDB
docker cp ./mongodb_backup nail_dashboard_mongodb:/data/restore
docker compose exec mongodb mongorestore \
  --username=${MONGO_ROOT_USERNAME} \
  --password=${MONGO_ROOT_PASSWORD} \
  /data/restore

# Restore SQLite
docker cp ./db_backup.sqlite3 nail_dashboard_backend:/app/db.sqlite3
docker compose restart backend
```

### Scale Services (if needed)

```bash
# Run multiple backend workers
docker compose up -d --scale backend=3
```

## Monitoring

### Check Service Health

```bash
# Health status
docker compose ps

# Resource usage
docker stats

# Container details
docker compose exec backend python manage.py check
```

### Monitor Nginx Access

```bash
# Follow access logs
docker compose logs -f nginx | grep "GET"

# Error logs only
docker compose logs -f nginx | grep "error"
```

## Security Best Practices

1. **Strong Passwords**: Use complex passwords for MongoDB
2. **Secret Key**: Generate unique Django secret key
3. **Firewall**: Only open ports 80, 443, and 22 (SSH)
4. **Updates**: Regularly update Docker images
5. **Backups**: Schedule automated backups
6. **SSL**: Keep certificates up to date (auto-renewed)
7. **Environment Variables**: Never commit `.env` to git

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs backend

# Check configuration
docker compose config

# Verify environment variables
docker compose exec backend env | grep -E "(SECRET|MONGO|ALLOWED)"
```

### MongoDB Connection Issues

```bash
# Test MongoDB connection
docker compose exec backend python -c "
from pymongo import MongoClient
import os
uri = os.environ.get('MONGODB_URI')
client = MongoClient(uri)
print('MongoDB connected:', client.server_info()['version'])
"
```

### SSL Certificate Issues

```bash
# Test certificate
docker compose exec nginx nginx -t

# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Manually renew
docker compose exec certbot certbot renew --dry-run
```

### Frontend Can't Connect to Backend

```bash
# Check CORS settings
docker compose exec backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.CORS_ALLOWED_ORIGINS)

# Verify API is accessible
curl -k https://yourdomain.com/api/v1/annotations/?limit=1
```

### Image Files Not Showing

```bash
# Verify mount point
docker compose exec backend ls -la /app/nail_images

# Check MongoDB paths
docker compose exec backend python -c "
from pymongo import MongoClient
import os
uri = os.environ.get('MONGODB_URI')
client = MongoClient(uri)
db = client[os.environ.get('MONGO_DATABASE')]
doc = db[os.environ.get('MONGO_COLLECTION')].find_one()
print('Sample image path:', doc.get('image_path'))
"
```

### Rebuild from Scratch

```bash
# Complete cleanup (WARNING: deletes all data)
docker compose down -v
docker system prune -a

# Rebuild
docker compose build --no-cache
docker compose up -d
```

## Performance Optimization

### Increase Workers

Edit `docker-compose.yml` or `backend/Dockerfile`:
```yaml
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "8", "--timeout", "120"]
```

### Enable Caching

Add Redis for caching:
```yaml
redis:
  image: redis:alpine
  networks:
    - nail_network
```

### Database Indexing

MongoDB indexes are created automatically on first data import.

## Production Checklist

- [ ] Changed all default passwords
- [ ] Generated new Django SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configured ALLOWED_HOSTS
- [ ] Updated CORS_ALLOWED_ORIGINS
- [ ] SSL certificate obtained and installed
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Created Django superuser
- [ ] Tested data import
- [ ] Verified frontend loads correctly
- [ ] Tested API endpoints
- [ ] Scheduled automated backups
- [ ] Configured log rotation
- [ ] Monitoring setup (optional: Prometheus, Grafana)

## Support & Resources

- **Django Documentation**: https://docs.djangoproject.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Docker Documentation**: https://docs.docker.com/
- **Let's Encrypt**: https://letsencrypt.org/
- **Nginx Documentation**: https://nginx.org/en/docs/

## File Structure

```
nail_annotation_dashboard/
├── docker-compose.yml          # Orchestration file
├── .env                        # Environment variables (create from .env.example)
├── .env.example                # Environment template
├── .dockerignore               # Global Docker ignore
├── backend/
│   ├── Dockerfile              # Backend image definition
│   ├── entrypoint.sh           # Startup script with auto-import
│   ├── requirements.txt        # Python dependencies
│   ├── .dockerignore           # Backend-specific ignores
│   ├── annotations.json        # Data for initial import
│   ├── core/settings.py        # Django settings (env-aware)
│   └── ...
├── frontend/
│   ├── Dockerfile              # Frontend image definition
│   ├── .dockerignore           # Frontend-specific ignores
│   ├── next.config.ts          # Next.js config (standalone mode)
│   └── ...
└── nginx/
    ├── Dockerfile              # Nginx image definition
    ├── nginx.conf              # Nginx configuration
    ├── ssl/                    # SSL certificates
    └── certbot/                # Let's Encrypt files
```

## Maintenance Schedule

- **Daily**: Check logs for errors
- **Weekly**: Verify backups, review resource usage
- **Monthly**: Update Docker images, review security patches
- **Quarterly**: Review and rotate credentials if needed

---

**Deployment Complete! 🚀**

Your Nail Annotation Dashboard is now running securely with HTTPS.

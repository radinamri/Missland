# Docker Deployment - Quick Reference

## Files Created

```
.
├── docker-compose.yml          # Main orchestration
├── .env.example                # Environment template
├── .dockerignore               # Global ignore
├── DEPLOYMENT.md               # Full deployment guide
├── backend/
│   ├── Dockerfile              # Backend container
│   ├── requirements.txt        # Python deps
│   ├── entrypoint.sh           # Startup + auto-import
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Frontend container
│   └── .dockerignore
└── nginx/
    ├── Dockerfile              # Nginx container
    └── nginx.conf              # Reverse proxy config
```

## Quick Deploy

### Simple Method (Recommended)
```bash
./deploy.sh build   # Build images
./deploy.sh start   # Start services
./deploy.sh ssl     # Setup HTTPS (optional)
./deploy.sh admin   # Create admin user
```

### Manual Method
```bash
# 1. Setup environment
cp .env.example .env
nano .env  # Edit: passwords, domain, paths

# 2. Start services
docker compose up -d

# 3. Setup SSL (after DNS points to server)
docker compose stop nginx
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com
docker compose start nginx

# 4. Create admin user
docker compose exec backend python manage.py createsuperuser
```

## Deploy Script Commands

```bash
./deploy.sh build      # Build Docker images
./deploy.sh start      # Start all services
./deploy.sh stop       # Stop all services
./deploy.sh restart    # Restart all services
./deploy.sh logs       # View all logs
./deploy.sh status     # Show service status
./deploy.sh ssl        # Setup HTTPS/SSL
./deploy.sh admin      # Create admin user
./deploy.sh backup     # Backup databases
./deploy.sh update     # Update and rebuild
./deploy.sh clean      # Remove containers
./deploy.sh help       # Show all commands
```

## Key Features

- ✅ Auto-imports `annotations.json` on first run (checks for duplicates)
- ✅ HTTPS/SSL with Let's Encrypt (auto-renewal)
- ✅ Static file hosting via Nginx
- ✅ Health checks on all services
- ✅ Persistent volumes for data
- ✅ Read-only mount for nail images
- ✅ Multi-stage builds (small images)
- ✅ Environment-based configuration

## Architecture

```
Internet → Nginx:443 (SSL) → Frontend:3000 + Backend:8000 → MongoDB:27017
```

See `DEPLOYMENT.md` for complete guide.

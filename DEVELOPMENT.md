# Missland Development Guide

## 🚀 Quick Start

### Local Development (Your Mac)
```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Start Django backend
cd backend
python manage.py runserver

# 3. In another terminal, start Next.js frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin

**Admin Credentials:**
- Username: `admin`
- Password: `MissYazdan78Radin79Vargha80land2025`

---

## 📦 Production Deployment Workflow

### 1. Make Changes Locally
```bash
# Edit files
vim backend/core/views.py

# Test locally
python manage.py runserver
# Visit http://localhost:8000
```

### 2. Commit & Push to GitHub
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

### 3. Deploy to Server
```bash
# SSH to server
ssh root@46.249.102.155

# Navigate to project
cd ~/Missland

# Pull latest changes
git pull origin main

# Rebuild affected services (example for backend changes)
docker-compose up --build -d django

# OR rebuild frontend for frontend changes
docker-compose up --build -d nextjs

# OR rebuild all services
docker-compose up --build -d

# Check logs
docker-compose logs -f django
docker-compose logs -f nextjs
```

### 4. Verify Deployment
```bash
# Test API
curl http://46.249.102.155/api/posts/ | head

# Visit in browser
open http://46.249.102.155
```

---

## 🔧 Common Tasks

### Run Django Migrations
**Local:**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

**Server:**
```bash
docker-compose exec django python manage.py makemigrations
docker-compose exec django python manage.py migrate
```

### Create Superuser
**Local:**
```bash
python manage.py createsuperuser
```

**Server:**
```bash
docker-compose exec django python manage.py createsuperuser
```

### Import Nail Images Data
**Local:**
```bash
python manage.py import_real_posts
python manage.py seed_articles
```

**Server:**
```bash
docker-compose exec django python manage.py import_real_posts
docker-compose exec django python manage.py seed_articles
```

### View Logs
**Server:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f django
docker-compose logs -f nextjs
docker-compose logs -f nginx
```

### Restart Services
**Server:**
```bash
# Restart specific service
docker-compose restart django
docker-compose restart nextjs

# Restart all
docker-compose restart
```

### Stop Services
**Server:**
```bash
docker-compose down
```

---

## 🐛 Troubleshooting

### Redis Connection Error
If you see "Redis connection refused" locally:
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# OR run Redis manually
redis-server
```

### PostgreSQL Connection Error
If you see "PostgreSQL connection refused" locally:
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
psql postgres
CREATE DATABASE missland_db;
\q
```

### Images Not Displaying on Server
```bash
# Check if images exist
docker-compose exec django ls -lh /app/media/nails/ | head

# Check nginx serving media files
curl -I http://46.249.102.155/media/nails/nail_image001.jpg

# Check database URLs
docker-compose exec django python manage.py shell -c "from core.models import Post; print(Post.objects.first().image_url)"
```

### Frontend Not Loading
```bash
# Rebuild without cache
docker-compose stop nextjs
docker-compose rm -f nextjs
docker-compose build --no-cache nextjs
docker-compose up -d nextjs
```

---

## 📁 Project Structure

```
Missland/
├── backend/                # Django backend
│   ├── config/            # Django settings
│   │   ├── settings.py           # Local development settings
│   │   └── settings_production.py # Production settings
│   ├── core/              # Main app
│   │   ├── models.py      # Database models
│   │   ├── views.py       # API endpoints
│   │   ├── serializers.py # DRF serializers
│   │   └── urls.py        # URL routing
│   └── manage.py
│
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js 15 app directory
│   ├── components/       # React components
│   ├── utils/           # Utility functions (api.ts)
│   └── package.json
│
├── nginx/               # Nginx configuration
│   └── nginx.conf      # Reverse proxy config
│
├── scripts/            # Deployment scripts
│   ├── entrypoint-django.sh
│   └── entrypoint-nextjs.sh
│
├── docker-compose.yml  # Docker orchestration
├── Dockerfile.django   # Django container
└── Dockerfile.nextjs   # Next.js container
```

---

## 🌐 Environment Variables

### Local Development
Edit `backend/config/settings.py` for local settings.
Frontend API URL is set in `frontend/utils/api.ts`.

### Production (Server)
Settings are in `.env.docker` (not committed to Git).

**Key Variables:**
- `NEXT_PUBLIC_API_URL` - Frontend API URL
- `MEDIA_BASE_URL` - Base URL for media files
- `ALLOWED_HOSTS` - Django allowed hosts
- `CORS_ALLOWED_ORIGINS` - CORS settings

---

## 📝 Git Workflow

```bash
# Create feature branch (optional)
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Merge to main (via PR or directly)
git checkout main
git merge feature/new-feature
git push origin main

# Deploy to server (see Production Deployment above)
```

---

## 🔐 Security Notes

- Never commit `.env.docker` (contains sensitive credentials)
- Never commit `.env` or `.env.local`
- Server uses HTTPS-ready nginx config (add SSL certificate later)
- Change default passwords in production

---

## 📚 Useful Commands Reference

### Docker
```bash
# Build and start all services
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec [service_name] [command]

# Rebuild specific service
docker-compose up --build -d [service_name]
```

### Django
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell
python manage.py shell

# Run tests
python manage.py test
```

### Next.js
```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start
```

---

## 🎯 Development Tips

1. **Always test locally before pushing to server**
2. **Use meaningful commit messages**
3. **Check Docker logs if something doesn't work on server**
4. **Keep local and production settings in sync**
5. **Backup database before major migrations**

---

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- Restart service: `docker-compose restart [service_name]`
- Rebuild: `docker-compose up --build -d [service_name]`
- Connect to container: `docker-compose exec [service_name] sh`

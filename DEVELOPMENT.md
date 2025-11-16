# Missland Development Guide

## ⚠️ Important: Local Development vs Production

- **Local Development**: Use native Python and Node.js (fast, simple, no Docker needed)
- **Production Server**: Use Docker Compose (containerized, production-ready)

**DO NOT use Docker for local development** - it's slower, more complex, and unnecessary.

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.13 (or 3.11+)
- Node.js 20+
- PostgreSQL (or use SQLite for local dev)
- Redis (optional for local dev)

### 1. Backend Setup

```bash
# Navigate to project root
cd Missland

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux

# Install dependencies
cd backend
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
# Backend will run at http://127.0.0.1:8000
```

### 2. Frontend Setup

```bash
# In a NEW terminal, navigate to frontend
cd Missland/frontend

# Install dependencies (first time only)
npm install

# Start Next.js development server
npm run dev
# Frontend will run at http://localhost:3000
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api/
- **Django Admin**: http://127.0.0.1:8000/admin/

---

## Production Deployment Workflow

### Step 1: Develop and Test Locally
```bash
# Make changes to code
# Test on local dev servers (Django + Next.js)
```

### Step 2: Commit and Push
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

### Step 3: Deploy to Server
```bash
# SSH to production server
ssh root@46.249.102.155

# Navigate to project
cd ~/Missland

# Pull latest changes
git pull origin main

# Rebuild and restart Docker containers
docker-compose up --build -d

# Check logs if needed
docker-compose logs -f

# Exit SSH
exit
```

### Step 4: Verify Deployment
Visit http://46.249.102.155 to confirm changes are live.

---

## Common Development Tasks

### Database Operations

#### Local Development (Native Django)
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (CAUTION: Deletes all data)
rm db.sqlite3  # if using SQLite
python manage.py migrate
```

#### Production Server (Docker)
```bash
ssh root@46.249.102.155
cd ~/Missland

# Run migrations in Docker
docker-compose exec django python manage.py makemigrations
docker-compose exec django python manage.py migrate

# Create superuser in Docker
docker-compose exec django python manage.py createsuperuser
```

### Import Nail Design Data

#### Local Development
```bash
# Make sure you have the data files in backend/data/
python manage.py import_real_posts

# Seed articles
python manage.py seed_articles
```

#### Production Server
```bash
# Data is automatically imported on first container startup
# if IMPORT_REAL_POSTS=true in .env.docker

# Manual import:
docker-compose exec django python manage.py import_real_posts
docker-compose exec django python manage.py seed_articles
```

---

## Troubleshooting

### Redis Connection Error (Local)
**Error**: `Module 'redis.connection' does not define a 'HiredisParser'`

**Solution**: Already fixed in `backend/config/settings.py`. If you see this:
1. Make sure you pulled latest code
2. Redis is optional for local dev - the app will work without it

### PostgreSQL Connection Error (Local)
If you don't want to install PostgreSQL locally, use SQLite:
1. Comment out PostgreSQL config in `backend/config/settings.py`
2. Uncomment SQLite config
3. Run `python manage.py migrate`

### Frontend Won't Start
```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Backend Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
python manage.py runserver 8001
```

---

## Project Structure

```
Missland/
├── backend/              # Django backend
│   ├── config/          # Django settings
│   ├── core/            # Main app (models, views, serializers)
│   ├── data/            # Data files (annotations.json)
│   ├── media/           # Uploaded files (nail images)
│   ├── manage.py        # Django management
│   └── requirements.txt # Python dependencies
├── frontend/            # Next.js frontend
│   ├── app/            # Next.js 15 App Router pages
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── public/         # Static files
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── docker-compose.yml   # PRODUCTION ONLY
├── Dockerfile.django    # PRODUCTION ONLY
├── Dockerfile.nextjs    # PRODUCTION ONLY
├── nginx/              # PRODUCTION ONLY
└── scripts/            # PRODUCTION ONLY
```

---

## Environment Variables

### Local Development
No `.env` file needed! Settings are in:
- `backend/config/settings.py` (local Django settings)
- `frontend/.env.local` (optional Next.js variables)

### Production Server
- `.env.docker` (on server, contains secrets - NOT committed to Git)

---

## Git Workflow

```bash
# Check current status
git status

# Create feature branch (optional)
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: description"

# Push to GitHub
git push origin main  # or your branch name

# Deploy to server (see Production Deployment Workflow above)
```

---

## Important Notes

### Security
- **NEVER** commit `.env.docker` to Git (it's in .gitignore)
- **NEVER** commit API keys or passwords
- Production uses `settings_production.py` with DEBUG=False
- Local uses `settings.py` with DEBUG=True

### Database
- **Local**: Use SQLite for simplicity or PostgreSQL if you prefer
- **Production**: PostgreSQL in Docker container

### Media Files
- **Local**: Media files stored in `backend/media/`
- **Production**: Media files in Docker volume, served by Nginx

### API Endpoints
- **Local**: http://127.0.0.1:8000/api/auth/posts/
- **Production**: http://46.249.102.155/api/posts/ (Nginx rewrites to /api/auth/posts/)

---

## Quick Reference Commands

### Django
```bash
python manage.py runserver          # Start dev server
python manage.py makemigrations     # Create migrations
python manage.py migrate            # Apply migrations
python manage.py createsuperuser    # Create admin user
python manage.py shell              # Django shell
python manage.py collectstatic      # Collect static files (production)
```

### Next.js
```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

### Docker (Production Server Only)
```bash
docker-compose up -d                    # Start all containers
docker-compose down                     # Stop all containers
docker-compose up --build -d            # Rebuild and start
docker-compose logs -f                  # View logs
docker-compose logs -f django           # View Django logs only
docker-compose exec django bash         # Shell into Django container
docker-compose exec django python manage.py migrate  # Run Django commands
docker-compose ps                       # List running containers
docker-compose restart django           # Restart specific service
```

---

## Getting Help

1. Check this guide first
2. Check Django docs: https://docs.djangoproject.com/
3. Check Next.js docs: https://nextjs.org/docs
4. Review error messages carefully
5. Check Docker logs: `docker-compose logs -f` (production)
6. Check Django logs: Look for red error messages in terminal

---

**Remember**: Develop locally with native tools, deploy to production with Docker! 🚀

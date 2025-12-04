# Missland - Nail Design Platform 💅

Modern web platform for discovering and sharing nail art designs with AI-powered recommendations.

## Features

- 🎨 Browse 3,883+ professional nail designs
- 🔍 Advanced search with color and style filters  
- 💝 Save designs to collections
- 🤖 AI-powered recommendations
- 📱 Progressive Web App (PWA)
- 🔐 Google OAuth authentication
- 📝 Beauty tips blog
- 🖼️ Virtual try-on preview

## Tech Stack

**Backend:**
- Django 5.2.8 + Django REST Framework 3.16.1
- PostgreSQL 16 + Redis 7
- django-allauth 65.13.0 (OAuth)
- Gunicorn 23.0.0

**Frontend:**
- Next.js 15.0.3 + React 19
- TypeScript + Tailwind CSS
- Zustand (state management)
- PWA enabled

---

## Environment Setup - Four-File Strategy

This project uses a **four-file .env strategy** for secure configuration across all folders:

### Configuration Files Structure

**In root folder, backend folder, and frontend folder:**

| File | Purpose | Tracked | Usage |
|------|---------|---------|-------|
| **`.env.docker.example`** | Production template | ✅ Git | Reference for production deployment |
| **`.env.docker`** | Production secrets | ❌ Git-ignored | Server secrets (never commit) |
| **`.env.local.docker.example`** | Local dev template | ✅ Git | Reference for local development |
| **`.env.local.docker`** | Local dev secrets | ❌ Git-ignored | Local configuration (never commit) |

**Key Rules:**
- ✅ `.env.*example` files are tracked in Git (safe to commit - example values only)
- ❌ `.env.docker` and `.env.local.docker` are git-ignored (never commit - real secrets)
- Never commit files containing real secrets, credentials, or API keys

### File Locations

```
Missland/
├── .env.docker                    # Production config (git-ignored)
├── .env.docker.example            # Production template (tracked)
├── .env.local.docker              # Local dev config (git-ignored)
├── .env.local.docker.example      # Local dev template (tracked)
│
├── backend/
│   ├── .env.docker                # Backend production (git-ignored)
│   ├── .env.docker.example        # Backend production template (tracked)
│   ├── .env.local.docker          # Backend local dev (git-ignored)
│   └── .env.local.docker.example  # Backend local dev template (tracked)
│
└── frontend/
    ├── .env.docker                # Frontend production (git-ignored)
    ├── .env.docker.example        # Frontend production template (tracked)
    ├── .env.local.docker          # Frontend local dev (git-ignored)
    └── .env.local.docker.example  # Frontend local dev template (tracked)
```

---

## 🚀 Quick Start

### Local Development (Recommended)

Best for development with hot-reloading and easy debugging:

```bash
# 1. Copy and configure local environment
cp .env.local.docker.example .env.local.docker
nano .env.local.docker  # Edit with your values

# 2. Terminal 1: Start Docker services (PostgreSQL + Redis)
docker-compose --env-file .env.local.docker up -d postgres redis

# 3. Terminal 2: Start Django backend
cd backend
python -m venv .venv  # Create venv if needed
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 4. Terminal 3: Start Next.js frontend
cd frontend
npm install  # First time only
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000/api
- Admin Panel: http://127.0.0.1:8000/admin

**First run:**
- Automatically imports 3,883 nail designs
- Seeds blog articles
- Creates admin superuser (from `.env.local.docker`)

**For complete setup:** See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

**Why local development?**
- ✅ Instant hot-reload for frontend changes
- ✅ Direct Python debugging access
- ✅ Faster iteration than full Docker
- ✅ Easy database inspection with Django shell
- ✅ Same data as production (Docker PostgreSQL)

### Production Deployment

Deploy to production server (46.249.102.155) or your own server:

```bash
# 1. SSH to server
ssh root@46.249.102.155

# 2. Clone and configure
git clone <your-repo-url>
cd Missland
cp .env.docker.example .env.docker
nano .env.docker  # Set production secrets

# 3. Deploy
docker-compose up -d

# 4. Verify
docker-compose ps
curl http://46.249.102.155/api/health/
```

**For complete deployment guide:** See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

**Access after deployment:**
- Frontend: http://46.249.102.155
- Admin: http://46.249.102.155/admin
- API: http://46.249.102.155/api

---

## Configuration

### Required Environment Variables

```bash
# Django security
SECRET_KEY=<generate-50-char-random-string>

# Database (PostgreSQL)
DB_NAME=missland_db
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_HOST=postgres  # Docker: "postgres", Local: "127.0.0.1"
DB_PORT=5432

# Redis (caching)
REDIS_URL=redis://redis:6379/1  # Docker or redis://127.0.0.1:6379/1 local

# Superuser (auto-created on first run)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@missland.local
DJANGO_SUPERUSER_PASSWORD=<strong-password>

# URLs
BASE_URL=http://46.249.102.155  # Production or http://127.0.0.1:8000 local
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
```

### Optional Variables

```bash
# Debugging and data
DEBUG=True  # Set to False in production
IMPORT_REAL_POSTS=true
SEED_ARTICLES=true

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=<your-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>

# AI Features (optional)
OPENAI_API_KEY=<your-api-key>

# Email (optional)
EMAIL_HOST=<your-email-host>
EMAIL_PORT=587
EMAIL_HOST_USER=<your-email>
EMAIL_HOST_PASSWORD=<your-password>
```

**See `.env.docker.example` and `.env.local.docker.example` for complete variable reference.**

---

## Documentation

### Core Guides

1. **[docs/ENVIRONMENT_CONFIGURATION.md](./docs/ENVIRONMENT_CONFIGURATION.md)**
   - Complete .env file setup and strategy
   - Four-file strategy explained
   - Setup instructions for production and local development
   - Troubleshooting and best practices

2. **[docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)**
   - Complete local development setup guide
   - Terminal-by-terminal instructions
   - Database operations and management commands
   - Performance tips and debugging

3. **[docs/DOCKER_DEPLOYMENT.md](./docs/DOCKER_DEPLOYMENT.md)**
   - Production deployment complete guide
   - Server setup and prerequisites
   - Docker service architecture
   - Monitoring, backup, and recovery

4. **[README.md](./README.md)** (this file)
   - Project overview
   - Quick start guides
   - API endpoints and features

---

## Project Structure

```
Missland/
├── .env.docker                 # Production config (git-ignored, secrets)
├── .env.docker.example         # Production template (tracked, safe)
├── .env.local.docker          # Local dev config (git-ignored, secrets)
├── .env.local.docker.example  # Local dev template (tracked, safe)
│
├── backend/                    # Django REST API
│   ├── config/                # Django settings and WSGI
│   ├── core/                  # Main app (models, views, serializers)
│   ├── manage.py              # Django management
│   ├── requirements.txt        # Python dependencies
│   ├── data/                  # Nail design data (3,883 designs)
│   └── media/                 # Uploaded images (collections, profile pics)
│
├── frontend/                   # Next.js application
│   ├── app/                   # Pages and routes (Next.js 15 App Router)
│   ├── components/            # React components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions and API client
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   └── tsconfig.json          # TypeScript configuration
│
├── docker-compose.yml         # Service orchestration
├── Dockerfile.django          # Django container image
├── Dockerfile.nextjs          # Next.js container image
├── nginx/                     # Reverse proxy configuration
├── scripts/                   # Container entrypoint scripts
├── deployment/                # Deployment utilities
│
├── LOCAL_DEVELOPMENT.md       # Local dev setup guide
├── DOCKER_DEPLOYMENT.md       # Production deployment guide
└── README.md                  # This file
```

---

## Common Development Tasks

### Starting Fresh

```bash
# Backend
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py import_real_posts
python manage.py seed_articles

# Frontend
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Database Operations

```bash
# Access Django shell
python manage.py shell

# Access PostgreSQL directly
docker-compose --env-file .env.local.docker exec postgres \
  psql -U postgres -d missland_db

# Backup database
docker-compose exec postgres pg_dump -U postgres missland_db > backup.sql

# Reset database
docker-compose down -v postgres redis
docker-compose up -d postgres redis
python manage.py migrate
```

### Management Commands

```bash
# Import nail designs
python manage.py import_real_posts

# Seed blog articles
python manage.py seed_articles

# Create superuser
python manage.py createsuperuser

# Collect static files (production)
python manage.py collectstatic --noinput
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/posts/` | List nail designs with filters |
| GET | `/api/posts/{id}/` | Design detail |
| POST | `/api/posts/{id}/save/` | Save to collection |
| GET | `/api/recommendations/` | AI recommendations |
| GET | `/api/articles/` | Blog articles |
| POST | `/api/auth/google/` | Google OAuth login |
| GET | `/api/health/` | Health check |
| GET | `/api/docs/` | API documentation |

---

## Troubleshooting

### Local Development Issues

**"role 'postgres' does not exist"**
```bash
# Stop local PostgreSQL (Homebrew)
brew services stop postgresql@14

# Restart Docker PostgreSQL
docker-compose --env-file .env.local.docker down -v postgres redis
docker-compose --env-file .env.local.docker up -d postgres redis
```

**"Connection refused on port 5432"**
```bash
# Verify Docker containers running
docker-compose --env-file .env.local.docker ps

# Check logs
docker-compose --env-file .env.local.docker logs postgres
```

**"CORS error" in frontend**
```bash
# Verify backend URL in frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Verify backend is running
curl http://127.0.0.1:8000/api/health/
```

**"Port already in use"**
```bash
# Find process using port
lsof -i :3000      # Frontend
lsof -i :8000      # Backend
lsof -i :5432      # Database

# Kill process or use different port
python manage.py runserver 8001
npm run dev -- -p 3001
```

### Production Issues

See [DOCKER_DEPLOYMENT.md - Troubleshooting](./DOCKER_DEPLOYMENT.md#troubleshooting) section.

---

## Key Features

### AI Recommendations
Uses color analysis and keyword extraction to suggest similar nail designs.

### Progressive Web App (PWA)
Installable on mobile devices with offline support and app-like experience.

### Google OAuth
Seamless authentication with Google accounts via django-allauth.

### Image Management
3,883 professional nail designs with metadata stored in PostgreSQL.

### Collections
Users can save designs to personal collections for easy access.

---

## Performance Considerations

### Local Development
- Django development server: Debug mode with auto-reload
- Next.js: Hot module replacement (instant reload)
- Redis: Optional caching layer
- Database: PostgreSQL in Docker for consistent schema

### Production
- Django: Gunicorn WSGI with 4 workers
- Next.js: Standalone production build
- Nginx: Reverse proxy with static file serving
- Redis: Production caching layer
- PostgreSQL: Production-grade database

---

## Security

- ✅ `.env.docker` and `.env.local.docker` are git-ignored
- ✅ `.env.*example` files are tracked (safe to commit)
- ✅ Passwords and secrets in environment variables only
- ✅ Google OAuth configured for authentication
- ✅ CORS configuration per environment
- ✅ Django CSRF protection enabled

**Important:** Never commit files with real secrets or credentials.

---

## Monitoring

```bash
# Service health
docker-compose ps

# Resource usage
docker stats

# View logs
docker-compose logs -f
docker-compose logs -f django
docker-compose logs -f nextjs

# API health
curl http://127.0.0.1:8000/api/health/
```

---

## Support

- **Admin Panel**: http://46.249.102.155/admin
- **API Docs**: http://46.249.102.155/api/docs
- **Issues**: Create GitHub issue
- **Guides**:
  - [Local Development](./LOCAL_DEVELOPMENT.md)
  - [Production Deployment](./DOCKER_DEPLOYMENT.md)

---

## License

Proprietary - All rights reserved

**Built with ❤️ by Missland Team**

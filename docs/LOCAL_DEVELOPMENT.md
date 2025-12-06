# Local Development Setup Guide

This guide covers setting up Missland for local development with:
- **Backend**: Django running with `python manage.py runserver`
- **Frontend**: Next.js running with `npm run dev`
- **Database**: PostgreSQL in Docker
- **Cache**: Redis in Docker
- **Reverse Proxy**: Nginx in Docker (optional)

## Quick Start (5 minutes)

### 1. Prerequisites

- **Python 3.11+** (Backend)
- **Node.js 20+** (Frontend)
- **Docker & Docker Compose** (Database, Redis)
- **Git**

### 2. Clone & Setup

```bash
git clone <repo-url> Missland
cd Missland

# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Install Node dependencies
cd frontend && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy example to local config (DO NOT COMMIT .env.local.docker)
cp .env.local.docker.example .env.local.docker

# Edit with your values (see "Required Configuration" below)
nano .env.local.docker  # or use your editor

# Stop any local PostgreSQL to avoid port conflicts
brew services stop postgresql@14  # macOS/Homebrew
sudo systemctl stop postgresql     # Linux/systemd
```

### 4. Start Services

#### Terminal 1: Start Docker services (Infrastructure & AI Chat)

```bash
cd Missland

# Start PostgreSQL, Redis, Weaviate, and RAG API for AI Chat
docker-compose --env-file .env.local.docker up -d postgres redis weaviate nail-rag-api

# Verify containers are running
docker-compose --env-file .env.local.docker ps

# Should show: missland_postgres, missland_redis, missland_weaviate, missland_nail_rag (all healthy)
```

**Note**: The unified docker-compose configuration includes:
- **postgres** (database on port 5432)
- **redis** (cache on port 6379)
- **weaviate** (vector database for AI on port 8080)
- **nail-rag-api** (AI Chat engine on port 8001)

#### Terminal 2: Start Backend

```bash
cd Missland
source .venv/bin/activate
cd backend

# Run migrations (first time only)
python manage.py migrate

# Create superuser (first time only)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will be available at: **http://127.0.0.1:8000**

#### Terminal 3: Start Frontend

```bash
cd Missland/frontend
npm run dev
```

Frontend will be available at: **http://localhost:3000**

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main app |
| **Backend API** | http://127.0.0.1:8000/api | REST API |
| **Django Admin** | http://127.0.0.1:8000/admin | Administration panel |
| **API Docs** | http://127.0.0.1:8000/api/docs | API documentation |
| **AI Chat API** | http://127.0.0.1:8001 | RAG engine for AI features |
| **Weaviate** | http://127.0.0.1:8080 | Vector database console |
| **PostgreSQL** | 127.0.0.1:5432 | Database (via Docker) |
| **Redis** | 127.0.0.1:6379 | Cache (via Docker) |

## Required Configuration

### Step 1: Update .env.local.docker

Copy `.env.local.docker.example` to `.env.local.docker` and set these **REQUIRED** values:

```bash
# Django Secret Key - Generate a new one:
SECRET_KEY=<generate-new-50-char-key>

# Database password (can be anything for local dev)
DB_PASSWORD=local_dev_password_123

# Admin superuser credentials (for Django admin)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@missland.local
DJANGO_SUPERUSER_PASSWORD=admin_password_123

# Google OAuth (optional - leave empty if not using)
GOOGLE_OAUTH_CLIENT_ID=<your-google-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CLIENT_ID=<same-as-above>
GOOGLE_CLIENT_SECRET=<same-as-above>
```

### Step 2: Generate Django Secret Key

```bash
# Option 1: Use Django's utility
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Option 2: Use online generator
# https://djecrety.ir/
```

### Step 4: Configure AI Chat (Optional)

For AI Chat and AI Stylist features, you'll need to enable the RAG service:

```bash
# In .env.local.docker, add OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-5.1

# These are set automatically:
RAG_SERVICE_URL=http://127.0.0.1:8001
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

The AI Chat requires:
1. **Weaviate** (vector database) - running in Docker
2. **RAG API** (FastAPI service) - running in Docker
3. **OpenAI API Key** - from https://platform.openai.com/api-keys

### Step 5: Verify frontend/.env.local

The `frontend/.env.local` is pre-configured for local development. Verify or update:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>  # Leave empty if not using
```

## Data Initialization

On first `python manage.py migrate`, the system automatically:

1. ✅ Creates all database tables
2. ✅ Imports 3,883 nail designs (if `IMPORT_REAL_POSTS=true`)
3. ✅ Seeds 12 blog articles (if `SEED_ARTICLES=true`)
4. ✅ Creates admin superuser (if `DJANGO_SUPERUSER_*` provided)

**To disable data import for faster initial setup:**

Edit `.env.local.docker`:

```bash
IMPORT_REAL_POSTS=false
SEED_ARTICLES=false
```

Then run migrations again (or manually import later):

```bash
python manage.py import_real_posts
python manage.py seed_articles
```

## Common Development Tasks

### View Database

```bash
# Access PostgreSQL container
docker-compose --env-file .env.local.docker exec postgres psql -U postgres -d missland_db

# Common psql commands
\dt              # List all tables
\d core_post     # Describe table
SELECT COUNT(*) FROM core_post;  # Count records
\q               # Quit
```

### View Logs

```bash
# Backend logs
tail -f /path/to/Missland/backend/logs/django.log

# Docker container logs
docker-compose --env-file .env.local.docker logs -f postgres
docker-compose --env-file .env.local.docker logs -f redis

# Frontend logs appear in terminal where `npm run dev` is running
```

### Run Management Commands

```bash
cd backend
source ../.venv/bin/activate

# Import nail designs
python manage.py import_real_posts

# Seed articles
python manage.py seed_articles

# Create another admin user
python manage.py createsuperuser

# Run Django shell
python manage.py shell

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic
```

### Reset Database

```bash
cd Missland

# Option 1: Keep data, run fresh migrations
python manage.py migrate --plan   # See what will run
python manage.py migrate --run-syncdb

# Option 2: Full reset (WARNING: deletes all data!)
docker-compose --env-file .env.local.docker down -v postgres redis
docker-compose --env-file .env.local.docker up -d postgres redis
sleep 3
cd backend && python manage.py migrate
```

### Develop Frontend with Real Backend Data

For debugging with actual data:

```bash
# Terminal 1: Docker services + real backend data
docker-compose --env-file .env.local.docker up -d postgres redis

# Terminal 2: Backend migrations with real posts
cd backend
python manage.py migrate
# Now database has all 3,883 nail designs

python manage.py runserver

# Terminal 3: Frontend connects to populated backend
cd frontend
npm run dev
```

## Troubleshooting

### Issue: "role 'postgres' does not exist"

**Cause**: Local PostgreSQL@14 (Homebrew) is running and conflicts with Docker PostgreSQL.

**Solution**:

```bash
# Stop local PostgreSQL
brew services stop postgresql@14  # macOS
sudo systemctl stop postgresql    # Linux

# Restart Docker PostgreSQL
docker-compose --env-file .env.local.docker down -v postgres redis
docker-compose --env-file .env.local.docker up -d postgres redis
```

### Issue: "Connection refused on port 5432"

**Cause**: Docker containers not running.

**Solution**:

```bash
# Start containers
docker-compose --env-file .env.local.docker up -d postgres redis

# Verify they're running
docker-compose --env-file .env.local.docker ps

# Check logs if unhealthy
docker-compose --env-file .env.local.docker logs postgres
```

### Issue: "ModuleNotFoundError: No module named 'django'"

**Cause**: Python dependencies not installed or venv not activated.

**Solution**:

```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r backend/requirements.txt
```

### Issue: Frontend can't connect to backend (CORS error)

**Cause**: `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is incorrect or backend is not running.

**Solution**:

```bash
# Verify backend is running
curl http://127.0.0.1:8000/api/health/

# Check frontend/.env.local
cat frontend/.env.local

# Should show: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Restart frontend if you changed .env.local
# Kill npm dev and run: npm run dev
```

### Issue: AI Chat is not working

**Cause**: RAG API not running or OPENAI_API_KEY not set.

**Solution**:

```bash
# Verify RAG service is running
docker-compose --env-file .env.local.docker ps nail-rag-api

# Check OPENAI_API_KEY is set
grep OPENAI_API_KEY .env.local.docker

# If not set, add it:
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local.docker

# Restart RAG services
docker-compose --env-file .env.local.docker restart nail-rag-api weaviate

# Check logs
docker-compose --env-file .env.local.docker logs -f nail-rag-api
```

### Issue: "Connection refused" on port 8001 (RAG API)

**Cause**: RAG API container not running or failed to start.

**Solution**:

```bash
# Check if Weaviate is healthy first (RAG API depends on it)
docker-compose --env-file .env.local.docker ps weaviate

# Restart both services
docker-compose --env-file .env.local.docker restart weaviate nail-rag-api

# Wait 30 seconds for startup
sleep 30

# Test connection
curl http://127.0.0.1:8001/health

# If still failing, check logs
docker-compose --env-file .env.local.docker logs nail-rag-api
```

### Issue: Port already in use

**Cause**: Another process is using port 3000 (frontend), 8000 (backend), 8001 (RAG), or 5432 (database).

**Solution**:

```bash
# Find process using port
lsof -i :3000      # Frontend
lsof -i :8000      # Backend
lsof -i :8001      # RAG API
lsof -i :5432      # Database

# Kill process
kill -9 <PID>

# Or use different port
python manage.py runserver 8001  # Backend on 8001
npm run dev -- -p 3001            # Frontend on 3001
```

## Environment Variables Reference

### Backend (.env)

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `DEBUG` | `True` | ✅ | Set to `True` for local dev |
| `SECRET_KEY` | None | ✅ | Min 50 random characters |
| `DB_NAME` | `missland_db` | ❌ | Database name |
| `DB_USER` | `postgres` | ❌ | Database user |
| `DB_PASSWORD` | None | ✅ | Database password |
| `DB_HOST` | `127.0.0.1` | ❌ | `127.0.0.1` for local Docker |
| `DB_PORT` | `5432` | ❌ | PostgreSQL port |
| `REDIS_URL` | `redis://127.0.0.1:6379/1` | ❌ | Redis for caching |
| `BASE_URL` | `http://127.0.0.1:8000` | ❌ | For absolute URLs |
| `DJANGO_SUPERUSER_USERNAME` | None | ❌ | Auto-create admin user |
| `DJANGO_SUPERUSER_EMAIL` | None | ❌ | Admin email |
| `DJANGO_SUPERUSER_PASSWORD` | None | ❌ | Admin password |
| `IMPORT_REAL_POSTS` | `true` | ❌ | Import 3,883 nail designs |
| `SEED_ARTICLES` | `true` | ❌ | Seed 12 blog articles |
| `OPENAI_API_KEY` | None | ❌ | For AI Stylist Chat (optional) |
| `OPENAI_MODEL` | `gpt-5.1` | ❌ | OpenAI model for AI chat |
| `RAG_SERVICE_URL` | `http://127.0.0.1:8001` | ❌ | AI Chat engine URL (local dev) |

### Frontend (.env.local)

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` | ✅ | Backend API endpoint |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | None | ❌ | For Google OAuth (optional) |
| `NODE_ENV` | `development` | ❌ | Leave as `development` |

## Development Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes to frontend/backend
# Edit files in frontend/ or backend/

# 3. Frontend changes auto-reload
# No restart needed - next dev watches for changes

# 4. Backend changes require restart
# Kill and restart: python manage.py runserver

# 5. Test in browser
# http://localhost:3000

# 6. Commit and push
git add .
git commit -m "feat: description"
git push origin feature/your-feature
```

### Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests (if configured)
cd frontend
npm test
```

### Database Migrations

```bash
# Create migration after model changes
python manage.py makemigrations

# Review migration file
# backend/core/migrations/0XXX_auto_*.py

# Apply migration
python manage.py migrate

# Rollback migration (be careful!)
python manage.py migrate core 0001
```

## Performance & Caching

### Enable Redis Caching

```bash
# In .env.local.docker
USE_REDIS=True

# Restart backend
# ctrl+c in Terminal 2
python manage.py runserver
```

### Clear Cache

```bash
# Via Django shell
python manage.py shell

from django.core.cache import cache
cache.clear()
exit()

# Or via Redis
docker-compose --env-file .env.local.docker exec redis redis-cli
> FLUSHDB
> EXIT
```

## Production Deployment

For production deployment, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

**Key differences from local development:**

### Environment Files
- Use `.env.docker` instead of `.env.local.docker`
- Apply production secrets to `.env.docker`
- Never commit `.env.docker` to Git

### Configuration
- Set `DEBUG=False`
- Use strong `SECRET_KEY` (50+ random characters)
- Use strong passwords (20+ characters with special chars)
- Configure production database credentials
- Set `ALLOWED_HOSTS` to your domain
- Configure CORS for your domain

### Deployment Strategy
- Use full Docker Compose stack (all 5 containers)
- Set up SSL/HTTPS with proper domain
- Configure Nginx for reverse proxy
- Enable health checks and monitoring
- Set up automated backups
- Configure log rotation

### Quick Deployment Steps

```bash
# SSH to server
ssh root@46.249.102.155

# Navigate to project
cd ~/Missland

# Pull latest code
git pull origin main

# Copy and configure environment
cp .env.docker.example .env.docker
nano .env.docker
# Update production secrets

# Deploy
docker-compose up -d

# Verify
docker-compose ps
curl http://46.249.102.155/api/health/
```

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete production guide.

---

## Additional Development Information

### Why Local Development Instead of Docker?

**Benefits of running Django/Node.js locally:**
- ✅ **Faster**: No container overhead, instant restarts
- ✅ **Better debugging**: Direct access to code and logs
- ✅ **Hot-reload**: Frontend changes instantly visible
- ✅ **Simpler**: One less layer of complexity
- ✅ **Same data**: Use Docker for just database and cache

**Docker is still used for:**
- PostgreSQL (consistent with production)
- Redis (caching layer)
- Weaviate (vector database for AI)
- RAG API (AI Chat engine)
- Production deployment (all services containerized)

### Local Dev vs Production Comparison

| Aspect | Local Dev | Production |
|--------|-----------|-----------|
| **Backend** | Native Python (runserver) | Docker (Gunicorn) |
| **Frontend** | Native Node.js (npm dev) | Docker standalone build |
| **Database** | Docker PostgreSQL | Docker PostgreSQL |
| **Cache** | Docker Redis | Docker Redis |
| **AI Chat** | Docker (RAG API + Weaviate) | Docker (RAG API + Weaviate) |
| **Reverse Proxy** | None (direct access) | Docker Nginx |
| **Static Files** | Automatic (dev server) | Docker volume |
| **Media Files** | Local directory | Docker volume |
| **Secrets** | `.env.local.docker` | `.env.docker` (git-ignored) |
| **Examples** | `.env.local.docker.example` | `.env.docker.example` |

### Environment File Strategy

**Three-file approach:**

1. **`.env.docker.example`** ✅ Tracked in Git
   - Template for production deployment
   - Safe to commit (example values only)
   - Reference for all available variables

2. **`.env.docker`** ❌ Git-ignored (git-ignored)
   - Production server configuration
   - Real secrets and credentials
   - Never committed to Git

3. **`.env.local.docker`** ❌ Git-ignored
   - Local development configuration
   - Simple passwords acceptable for local use
   - Never committed to Git

4. **`.env.local.docker.example`** ✅ Tracked in Git
   - Template for local development setup
   - Safe to commit (example values only)
   - Setup instructions included

**Backend .env files:**
- **`backend/.env`** - Local reference (git-ignored)
- Loads from `.env.local.docker` or `.env.docker`
- Documents value sourcing

**Frontend .env files:**
- **`frontend/.env.local`** - Local development (git-ignored)
- Simple API URL and Google OAuth config
- Development mode settings

## Need Help?

1. **Setup issues?** Check [this document's Troubleshooting section](#troubleshooting)
2. **Production deployment?** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
3. **API help?** Visit [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs) when backend is running
4. **Django logs?** Check `backend/logs/django.log`
5. **Docker logs?** Run `docker-compose logs -f`
6. **Project overview?** Check [README.md](README.md)

---

**Happy coding!** 🚀

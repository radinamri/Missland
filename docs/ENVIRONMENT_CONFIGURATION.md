# Environment Configuration Guide

Complete guide to Missland's four-file environment configuration strategy.

---

## Overview

Missland uses a **four-file .env strategy** for secure environment management:

1. **`.env.docker`** - Production configuration (git-ignored)
2. **`.env.docker.example`** - Production template (tracked in Git)
3. **`.env.local.docker`** - Local development configuration (git-ignored)
4. **`.env.local.docker.example`** - Local development template (tracked in Git)

**These four files exist in three locations:**
- Root folder: `/.env.*`
- Backend folder: `/backend/.env.*`
- Frontend folder: `/frontend/.env.*`

**Total: 12 environment files (4 types × 3 locations)**

---

## File Locations & Structure

```
Missland/
├── Root-level (.env files for docker-compose)
│   ├── .env.docker                    # ❌ GIT-IGNORED (Production secrets)
│   ├── .env.docker.example            # ✅ TRACKED (Production template)
│   ├── .env.local.docker              # ❌ GIT-IGNORED (Local dev secrets)
│   └── .env.local.docker.example      # ✅ TRACKED (Local dev template)
│
├── backend/ (Django backend .env files)
│   ├── .env.docker                    # ❌ GIT-IGNORED (Production secrets)
│   ├── .env.docker.example            # ✅ TRACKED (Production template)
│   ├── .env.local.docker              # ❌ GIT-IGNORED (Local dev secrets)
│   └── .env.local.docker.example      # ✅ TRACKED (Local dev template)
│
└── frontend/ (Next.js frontend .env files)
    ├── .env.docker                    # ❌ GIT-IGNORED (Production secrets)
    ├── .env.docker.example            # ✅ TRACKED (Production template)
    ├── .env.local.docker              # ❌ GIT-IGNORED (Local dev secrets)
    └── .env.local.docker.example      # ✅ TRACKED (Local dev template)
```

---

## File Purposes

### 1. `.env.docker.example` - Production Template

**Status**: ✅ TRACKED IN GIT (Safe to commit)

**Location**: 
- `/.env.docker.example`
- `/backend/.env.docker.example`
- `/frontend/.env.docker.example`

**Purpose**: 
- Template for production deployment
- Contains example/placeholder values only
- Used as reference when setting up production

**Usage**:
```bash
# Copy to actual production config
cp .env.docker.example .env.docker

# Edit with real production values
nano .env.docker
```

**Example Content**:
```bash
# Root level
DEBUG=False
SECRET_KEY=your-50-char-django-secret-key-replace-with-real-key
BASE_URL=http://46.249.102.155
NEXT_PUBLIC_API_URL=http://46.249.102.155/api

# Backend level
DEBUG=False
DB_PASSWORD=your-strong-database-password
DB_HOST=postgres

# Frontend level
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
NODE_ENV=production
```

---

### 2. `.env.docker` - Production Secrets

**Status**: ❌ GIT-IGNORED (Never commit)

**Location**: 
- `/.env.docker`
- `/backend/.env.docker`
- `/frontend/.env.docker`

**Purpose**: 
- ACTUAL production configuration with real secrets
- Used on production server only
- Contains real API keys, passwords, credentials

**Usage**:
```bash
# Created from template
cp .env.docker.example .env.docker

# Edit with REAL production secrets
nano .env.docker

# Deploy on server
docker-compose --env-file .env.docker up -d
```

**Security**:
- ⚠️ NEVER commit to Git
- ⚠️ NEVER share publicly
- ⚠️ Keep only on production server
- ✅ Protected by `.gitignore`

**Example Content** (Production server only):
```bash
# Root level
DEBUG=False
SECRET_KEY=ZFW5xyB7JS+9rDfcwVpmy7H3q+z1EJPb1ib2sbDCn2B1RT3iJAHd1GCdpUusVa+LBks=
BASE_URL=http://46.249.102.155
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
GOOGLE_OAUTH_CLIENT_ID=665407123210-20j9tne8tqgfi5t7dn6jr6taj51o0elk.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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

# Backend level
DB_PASSWORD=MissYazdan78Radin79Vargha80land2025
DJANGO_SUPERUSER_PASSWORD=MissYazdan78Radin79Vargha80land2025

# Frontend level
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
```

---

### 3. `.env.local.docker.example` - Local Development Template

**Status**: ✅ TRACKED IN GIT (Safe to commit)

**Location**: 
- `/.env.local.docker.example`
- `/backend/.env.local.docker.example`
- `/frontend/.env.local.docker.example`

**Purpose**: 
- Template for local development setup
- Contains example/placeholder values only
- Used as reference when setting up local environment

**Usage**:
```bash
# Copy to local development config
cp .env.local.docker.example .env.local.docker

# Edit with local development values
nano .env.local.docker
```

**Example Content**:
```bash
# Root level
DEBUG=True
SECRET_KEY=your-50-char-django-secret-key-or-use-generated
BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Backend level
DEBUG=True
DB_PASSWORD=local_dev_password_123
DB_HOST=127.0.0.1
DJANGO_SUPERUSER_PASSWORD=admin_password_123

# Frontend level
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NODE_ENV=development
```

---

### 4. `.env.local.docker` - Local Development Secrets

**Status**: ❌ GIT-IGNORED (Never commit)

**Location**: 
- `/.env.local.docker`
- `/backend/.env.local.docker`
- `/frontend/.env.local.docker`

**Purpose**: 
- ACTUAL local development configuration
- Used on your local machine only
- Contains local development secrets

**Usage**:
```bash
# Created from template
cp .env.local.docker.example .env.local.docker

# Edit with local values (simple passwords acceptable for local dev)
nano .env.local.docker

# Start local development
docker-compose --env-file .env.local.docker up -d postgres redis
python manage.py runserver
npm run dev
```

**Security**:
- ⚠️ NEVER commit to Git
- ⚠️ Keep on local machine only
- ✅ Protected by `.gitignore`
- ℹ️ Simple passwords acceptable (not used in production)

**Example Content** (Local machine only):
```bash
# Root level
DEBUG=True
SECRET_KEY=your-secret-key-or-any-value
BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Backend level
DB_PASSWORD=local_dev_password_123
DB_HOST=127.0.0.1
DJANGO_SUPERUSER_PASSWORD=admin_password_123

# Frontend level
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

---

## Quick Setup Guide

### Production Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd Missland

# 2. Create production config from template
cp .env.docker.example .env.docker
cp backend/.env.docker.example backend/.env.docker
cp frontend/.env.docker.example frontend/.env.docker

# 3. Edit all three .env.docker files with REAL production secrets
nano .env.docker
nano backend/.env.docker
nano frontend/.env.docker

# 4. Deploy
docker-compose --env-file .env.docker up -d
```

### Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd Missland

# 2. Create local config from template
cp .env.local.docker.example .env.local.docker
cp backend/.env.local.docker.example backend/.env.local.docker
cp frontend/.env.local.docker.example frontend/.env.local.docker

# 3. Edit all three .env.local.docker files with local values
nano .env.local.docker
nano backend/.env.local.docker
nano frontend/.env.local.docker

# 4. Start development environment
docker-compose --env-file .env.local.docker up -d postgres redis

# 5. In separate terminals:
# Terminal 2: Backend
cd backend && python manage.py runserver

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Root Level .env Files

The root-level `.env.*` files are used by `docker-compose.yml`:

### Root .env.docker (Production)

```bash
# Used by: docker-compose.yml on production server
# Run: docker-compose --env-file .env.docker up -d

DEBUG=False
SECRET_KEY=...
DB_PASSWORD=...
DJANGO_SUPERUSER_PASSWORD=...
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
# ... other variables
```

### Root .env.local.docker (Local Dev)

```bash
# Used by: docker-compose.yml for local development
# Run: docker-compose --env-file .env.local.docker up -d postgres redis

DEBUG=True
SECRET_KEY=...
DB_PASSWORD=local_dev_password_123
DJANGO_SUPERUSER_PASSWORD=admin_password_123
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
# ... other variables
```

---

## Backend .env Files

Backend .env files are loaded by Django when running `python manage.py runserver`:

### Backend .env.docker (Production)

```bash
# Used by: Django on production server (inside Docker)
DJANGO_SETTINGS_MODULE=config.settings
DEBUG=False
SECRET_KEY=...
DB_HOST=postgres  # Docker container name
DB_PASSWORD=...
ALLOWED_HOSTS=46.249.102.155
# ... other backend-specific variables
```

### Backend .env.local.docker (Local Dev)

```bash
# Used by: Django in local development
DJANGO_SETTINGS_MODULE=config.settings
DEBUG=True
SECRET_KEY=...
DB_HOST=127.0.0.1  # localhost
DB_PASSWORD=local_dev_password_123
ALLOWED_HOSTS=localhost,127.0.0.1
# ... other backend-specific variables
```

---

## Frontend .env Files

Frontend .env files are used by Next.js build/runtime:

### Frontend .env.docker (Production)

```bash
# Used by: Next.js on production server (inside Docker)
NEXT_PUBLIC_API_URL=http://46.249.102.155/api
NODE_ENV=production
# ... other frontend-specific variables
```

### Frontend .env.local.docker (Local Dev)

```bash
# Used by: Next.js in local development (npm run dev)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NODE_ENV=development
# ... other frontend-specific variables
```

---

## Environment Variables Reference

### Common Variables (All Levels)

| Variable | Production | Local Dev | Purpose |
|----------|-----------|-----------|---------|
| `DEBUG` | `False` | `True` | Django debug mode |
| `SECRET_KEY` | Secure 50+ chars | Any value | Django secret key |
| `NODE_ENV` | `production` | `development` | Next.js environment |
| `BASE_URL` | http://46.249.102.155 | http://127.0.0.1:8000 | Application base URL |

### Backend-Specific Variables

| Variable | Production | Local Dev | Purpose |
|----------|-----------|-----------|---------|
| `DB_HOST` | `postgres` | `127.0.0.1` | Database host |
| `DB_PASSWORD` | Strong (20+ chars) | `local_dev_password_123` | Database password |
| `REDIS_URL` | `redis://redis:6379/1` | `redis://127.0.0.1:6379/1` | Redis connection |
| `ALLOWED_HOSTS` | `46.249.102.155,localhost` | `localhost,127.0.0.1` | Allowed Django hosts |

### Frontend-Specific Variables

| Variable | Production | Local Dev | Purpose |
|----------|-----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | http://46.249.102.155/api | http://127.0.0.1:8000/api | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Real ID | (optional) | Google OAuth ID |

---

## Git Status

Check which files are tracked and ignored:

```bash
# View tracked .env files (should only be .example files)
git ls-files | grep "\.env"

# Check git status for .env files
git status .env*
git status backend/.env*
git status frontend/.env*

# Should see:
# ✅ Tracked: .env.docker.example, .env.local.docker.example
# ❌ Not tracked (git-ignored): .env.docker, .env.local.docker
```

---

## Troubleshooting

### "Secret key is a placeholder" error

**Problem**: Django loads a placeholder secret key

**Solution**:
```bash
# Generate real secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Update in appropriate .env file
# .env.docker for production
# .env.local.docker for local dev
```

### "Database connection refused"

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check DB_HOST in your .env file:
# - Production: DB_HOST=postgres (container name)
# - Local: DB_HOST=127.0.0.1 (localhost)

# Verify Docker containers running (local dev):
docker-compose --env-file .env.local.docker ps
```

### "Frontend can't reach backend"

**Problem**: CORS or API URL error

**Solution**:
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env.local.docker:
# Should be: http://127.0.0.1:8000/api (local dev)

# Verify backend running:
curl http://127.0.0.1:8000/api/health/
```

### "Wrong values in wrong environment"

**Problem**: Used production secrets in local development or vice versa

**Solution**:
```bash
# Always use the correct .env file:
# Local Dev: .env.local.docker, backend/.env.local.docker, frontend/.env.local.docker
# Production: .env.docker, backend/.env.docker, frontend/.env.docker

# Never mix configurations!
```

---

## Best Practices

1. **Always use examples first**
   - Copy `.env.*example` to `.env.*` before editing
   - Never modify example files directly

2. **Keep secrets secure**
   - Use strong, random passwords for production
   - Simple passwords acceptable for local development
   - Never share `.env.docker` files

3. **Use consistent values across files**
   - Root, backend, and frontend `.env.*` files must have matching values
   - Example: DB_PASSWORD in root must match DB_PASSWORD in backend

4. **Verify Git status**
   - Always check `.gitignore` protects your secrets
   - Only example files should be tracked
   - Review before committing: `git status`

5. **Document your environment**
   - Add comments to `.env.*example` files
   - Explain what each variable does
   - Help future developers understand setup

---

## Summary

| Scenario | Files to Use | Status |
|----------|--------------|--------|
| **First-time production setup** | Copy `.env.docker.example` → `.env.docker` | ✅ Git-ignored |
| **Production deployment** | Use `.env.docker` with real secrets | ✅ Git-ignored |
| **First-time local dev** | Copy `.env.local.docker.example` → `.env.local.docker` | ✅ Git-ignored |
| **Local development** | Use `.env.local.docker` with local values | ✅ Git-ignored |
| **Documentation reference** | Read `.env.*example` files | ✅ Tracked in Git |
| **New developer setup** | Reference `.env.*example` files | ✅ Tracked in Git |

---

**Last Updated**: December 4, 2025

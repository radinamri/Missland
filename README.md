# 💅 Missland - Nail Art Platform

A comprehensive nail art platform featuring image search, collections, virtual try-on, and social features.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git

### Development (Local)

```bash
# 1. Clone and configure
git clone <repository-url>
cd Missland
cp .env.example .env
nano .env  # Set DEBUG=True, add credentials

# 2. Start services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# 3. Create admin user (in another terminal)
docker-compose exec backend python manage.py createsuperuser

# Access: http://localhost:3000 (frontend) or http://localhost:8000 (backend)
```

### Production

```bash
# 1. Configure for production
cp .env.example .env
nano .env  # Set DEBUG=False, strong passwords, domain

# 2. Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Create admin user
docker-compose exec backend python manage.py createsuperuser

# Access: https://yourdomain.com
```

📖 **See [DOCKER_README.md](DOCKER_README.md) for complete Docker guide**

---

## 🏗️ Architecture

```
Internet → Nginx (SSL) → Next.js Frontend
                       → Django Backend (ASGI/Daphne)
                           ├── PostgreSQL (Users, Auth)
                           ├── MongoDB (Posts, Collections)
                           └── Redis (WebSocket)
```

**Tech Stack**: Django 5.2.4, Next.js 15.5.0, PostgreSQL 16, MongoDB 7.0, Redis 7, Nginx

---

## 🌟 Features

- 🔍 Advanced nail art search (text and image-based)
- 📱 Virtual try-on with real-time WebSocket
- 💾 Collections to save and organize designs
- 🔐 Google OAuth + JWT authentication
- 👥 User profiles and social features
- 📊 Admin dashboard for content management
- 🎨 AI-powered nail attribute classification

---

## 🛠️ Common Commands

```bash
# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Access PostgreSQL
docker-compose exec postgres psql -U missland_user -d missland_db

# Access MongoDB
docker-compose exec mongodb mongosh -u admin -p <password> --authenticationDatabase admin

# Django shell
docker-compose exec backend python manage.py shell
```

See [DOCKER_README.md](DOCKER_README.md) for complete command reference.

---

## 📦 Services

| Service | Port (Dev) | Description |
|---------|-----------|-------------|
| Nginx | 80, 443 | Reverse proxy with SSL |
| Frontend | 3000 | Next.js application |
| Backend | 8000 | Django REST API + WebSocket |
| PostgreSQL | 5432 | Primary database |
| MongoDB | 27017 | Document database |
| Redis | 6379 | Channel layer |

---

## 🗃️ Database Migration

Migrate from PostgreSQL to MongoDB:

```bash
# Preview migration
docker-compose exec backend python manage.py migrate_to_mongodb --dry-run

# Execute migration
docker-compose exec backend python manage.py migrate_to_mongodb

# Verify migration
docker-compose exec backend python manage.py verify_migration

# Enable MongoDB mode (edit .env)
USE_MONGODB=True
docker-compose restart backend
```

---

## 🔒 Security

- Environment-based configuration (no hardcoded secrets)
- SSL/TLS encryption with Let's Encrypt
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting on API endpoints
- JWT authentication with token rotation

---

## 📚 Documentation

- **[DOCKER_README.md](DOCKER_README.md)** - Complete Docker setup, commands, and troubleshooting
- **[.env.example](.env.example)** - Environment variables template
- **[docs/Tryon/BACKEND_STRUCTURE.md](docs/Tryon/BACKEND_STRUCTURE.md)** - Backend architecture
- **[docs/Mongo/MONGODB_MIGRATION_SUMMARY.md](docs/Mongo/MONGODB_MIGRATION_SUMMARY.md)** - Migration guide

---

## 📄 License

Proprietary software. All rights reserved.

---

Built with Django, Next.js, and Docker

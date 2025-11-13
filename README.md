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
- Next.js 15.5.0 + React 19.1.0
- TypeScript + Tailwind CSS
- Zustand (state management)
- PWA enabled

## Quick Start (Docker)

```bash
# Clone repository
git clone <your-repo-url>
cd Missland

# Setup environment
cp .env.docker .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Access application
http://localhost (or http://46.249.102.155)
```

**First run automatically:**
- Creates database schema
- Imports 3,883 nail designs
- Seeds blog articles  
- Creates admin user

## Project Structure

```
Missland/
├── backend/              # Django API
│   ├── core/            # Main app (models, views, serializers)
│   ├── config/          # Settings and configuration
│   └── data/            # annotations.json (3,883 designs)
├── frontend/            # Next.js application
│   ├── app/            # Pages and routes
│   ├── components/     # React components
│   └── utils/          # API client and helpers
├── docker-compose.yml  # Service orchestration
├── Dockerfile.django   # Backend container
├── Dockerfile.nextjs   # Frontend container
├── nginx/              # Reverse proxy config
└── scripts/            # Initialization scripts
```

## Development

### Local Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py import_real_posts
python manage.py seed_articles
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Docker Development

```bash
# Watch logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build

# Run Django commands
docker-compose exec django python manage.py <command>

# Access database
docker-compose exec postgres psql -U postgres -d missland_db
```

## Deployment

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy:**
```bash
# On server (46.249.102.155)
git clone <repo>
cd Missland
cp .env.docker .env
nano .env  # Set production values
docker-compose up -d
```

## API Endpoints

- `GET /api/posts/` - List nail designs with filters
- `GET /api/posts/{id}/` - Design detail
- `POST /api/posts/{id}/save/` - Save to collection
- `GET /api/recommendations/` - AI recommendations
- `GET /api/articles/` - Blog articles
- `POST /api/auth/google/` - Google OAuth login

## Environment Variables

**Required:**
```bash
SECRET_KEY=<django-secret>
DB_PASSWORD=<postgres-password>
DJANGO_SUPERUSER_PASSWORD=<admin-password>
GOOGLE_OAUTH_CLIENT_SECRET=<oauth-secret>
```

**Optional:**
```bash
DEBUG=False
ALLOWED_HOSTS=46.249.102.155
IMPORT_REAL_POSTS=true
SEED_ARTICLES=true
```

See `.env.docker` for complete configuration.

## Key Features Explained

### AI Recommendations
Uses color analysis and keyword extraction to suggest similar nail designs based on browsing history.

### Progressive Web App
Installable on mobile devices with offline support and app-like experience.

### Google OAuth
Seamless authentication integrated with django-allauth.

### Image Management
3,883 professional nail designs stored in `backend/media/nails/` with metadata in `data/annotations.json`.

## Management Commands

```bash
# Import nail designs
python manage.py import_real_posts

# Seed blog articles
python manage.py seed_articles

# Create admin user
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic
```

## Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests  
cd frontend
npm test
```

## Common Tasks

**Add new nail design:**
1. Add image to `backend/media/nails/`
2. Update `backend/data/annotations.json`
3. Run `python manage.py import_real_posts`

**Update packages:**
```bash
# Backend
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt

# Frontend
cd frontend
npm update
```

**Database backup:**
```bash
docker-compose exec postgres pg_dump -U postgres missland_db > backup.sql
```

## Monitoring

```bash
# Service health
docker-compose ps

# Resource usage
docker stats

# Application logs
docker-compose logs -f django
docker-compose logs -f nextjs

# Nginx access logs
docker-compose logs -f nginx
```

## Troubleshooting

**Containers won't start:**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Database connection failed:**
```bash
docker-compose exec postgres pg_isready
docker-compose exec django env | grep DB_
```

**Static files not loading:**
```bash
docker-compose exec django python manage.py collectstatic --noinput
```

## Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure strong `SECRET_KEY`
- [ ] Set secure database password
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set `CORS_ALLOWED_ORIGINS`
- [ ] Configure Google OAuth credentials
- [ ] Set superuser password
- [ ] Enable HTTPS (with domain)
- [ ] Setup backup automation
- [ ] Configure monitoring

## License

Proprietary - All rights reserved

## Support

- Admin Panel: `http://46.249.102.155/admin`
- API Docs: `http://46.249.102.155/api/`
- Issues: Create GitHub issue

---

**Built with** ❤️ **by Missland Team**

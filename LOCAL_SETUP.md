# Missland Local Development Setup Guide

## Prerequisites
- **PostgreSQL**: Already installed and running on `localhost:5432`
- **Python**: 3.10+ (using Python 3.13.2)
- **Node.js**: 18+ installed
- **Virtual Environment**: Already configured at `.venv/`

## Quick Start (3 Tabs)

### Tab 1: Start Django Backend
```bash
cd backend
source ../.venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```
✅ Backend runs on: **http://127.0.0.1:8000**

### Tab 2: Start Next.js Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend runs on: **http://localhost:3000**

### Tab 3 (Optional): Load Initial Data
On first-time setup, run these commands in a new terminal to populate the database:
```bash
cd backend
source ../.venv/bin/activate

# Load 3,883 real nail designs from annotations.json
python manage.py import_real_posts

# Load sample articles for the blog
python manage.py seed_articles
```
✅ Now navigate to http://localhost:3000 and see real nail designs displayed!

### Database Status
- ✅ PostgreSQL is running on `localhost:5432`
- ✅ Database `missland_db` exists and is initialized
- ✅ All migrations have been applied

### Loading Initial Data
Before accessing the app, load the real nail designs and articles:
```bash
cd backend
source ../.venv/bin/activate

# Import 3,883 real nail designs from annotations.json
python manage.py import_real_posts

# Create sample articles for the blog
python manage.py seed_articles
```

---

## What's Configured

### Backend (Django)
- **Database**: PostgreSQL `missland_db` on `localhost:5432`
- **Allowed Hosts**: `localhost`, `127.0.0.1`, `[::1]`
- **CORS**: Allows requests from `http://localhost:3000`
- **Authentication**: JWT tokens with Django allauth
- **Media Files**: 
  - Profile pictures: `/backend/media/profile_pictures/`
  - Nail design images: `/backend/media/nails/` (3,883 real images)
- **Admin**: http://127.0.0.1:8000/admin/

### Frontend (Next.js)
- **API Base URL**: `http://127.0.0.1:8000` (configured in `.env.local`)
- **Google OAuth**: Already configured with client credentials
- **Port**: `localhost:3000`
- **Features**: Context API for auth/search/navigation, Zustand for state management

---

## Useful Commands

### Backend Management
```bash
cd backend
source ../.venv/bin/activate

# Create superuser (for admin access)
python manage.py createsuperuser

# ⭐ Load real nail designs from annotations.json into the database
python manage.py import_real_posts

# ⭐ Load sample articles for the blog section
python manage.py seed_articles

# Run tests
python manage.py test

# Django shell
python manage.py shell
```

### Frontend Management
```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Run linter
npm run lint
```

---

## Troubleshooting

### Backend won't start
- **Error**: `psycopg2.OperationalError` → PostgreSQL not running. Check `brew services list` and restart if needed
- **Error**: Database connection refused → Verify `localhost:5432` in settings.py
- **Error**: Module not found → Ensure virtual environment is activated: `source ../.venv/bin/activate`

### Frontend won't start
- **Error**: Port 3000 already in use → Kill process with `lsof -i :3000` and `kill -9 <PID>`
- **Error**: API calls failing → Ensure backend is running on port 8000

### Database issues
- **Reset database** (if needed):
  ```bash
  cd backend
  python manage.py flush --no-input
  python manage.py migrate
  ```

---

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://127.0.0.1:8000 | REST API |
| Django Admin | http://127.0.0.1:8000/admin/ | Admin panel |
| API Docs | http://127.0.0.1:8000/api/ | Available endpoints |

---

## Development Notes

1. **Real Nail Images**: All 3,883 nail designs are stored in `/backend/media/nails/` with real image dimensions
2. **Image URLs**: Posts reference images as `/media/nails/nail_image###.jpg` (automatically served by Django)
3. **Frontend receives**: Relative URLs like `/media/nails/nail_image001.jpg` which are resolved to `http://127.0.0.1:8000/media/nails/nail_image001.jpg`
4. **Try-On Images**: Currently use the same image as the base design (Option A - simple and realistic)
5. **Frontend communicates with backend** automatically via `NEXT_PUBLIC_API_URL` environment variable
6. **JWT tokens** are stored in `localStorage` and sent with each API request
7. **CORS is configured** to allow frontend-backend communication
8. **Hot reload** is enabled for both frontend and backend during development

---

## Setup Verification Checklist

- ✅ PostgreSQL running on `localhost:5432`
- ✅ Database `missland_db` created and migrations applied
- ✅ Django backend dependencies installed
- ✅ Next.js frontend dependencies installed
- ✅ `ALLOWED_HOSTS` updated in Django settings
- ✅ CORS configuration allows frontend on port 3000

You're ready to start developing! 🚀

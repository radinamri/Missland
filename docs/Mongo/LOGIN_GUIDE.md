# Missland Login - Quick Reference

## Frontend Login Page
**URL**: `http://localhost:3000/login`

### Features:
- ✅ Email/Password authentication
- ✅ Google OAuth integration
- ✅ "Forgot Password" link
- ✅ "Sign Up" link to registration
- ✅ Show/hide password toggle
- ✅ Responsive design (mobile + desktop)
- ✅ Auto-redirect after successful login

---

## Backend Login API

### 1. Email/Password Login
**Endpoint**: `POST http://localhost:8000/api/token/`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response** (Success):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**JWT Payload**:
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "username": "username",
  "role": "ADMIN",
  "is_staff": true,
  "is_superuser": false,
  "exp": 1699999999,
  "iat": 1699996399
}
```

**Error Response** (401):
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### 2. Google OAuth Login
**Endpoint**: `POST http://localhost:8000/api/auth/google/`

**Request**:
```json
{
  "access_token": "google_oauth_access_token_here"
}
```

**Response**: Same as email/password login

---

## Login Flow

```
User enters credentials → Frontend calls /api/token/
                                    ↓
                          Backend validates credentials
                                    ↓
                          Returns JWT tokens (access + refresh)
                                    ↓
                Frontend stores in localStorage as "authTokens"
                                    ↓
                          Calls /api/auth/profile/ to get user info
                                    ↓
                          Stores user in AuthContext
                                    ↓
                          Redirects to homepage or dashboard
```

---

## Test Credentials

After running migrations and creating a user:

```bash
# Create superuser
python manage.py createsuperuser
# Enter: email, username, password

# Promote to ADMIN role
python manage.py promote_user your@email.com --role ADMIN --staff
```

Then login with:
- **Email**: your@email.com
- **Password**: (password you set)

---

## Dashboard Access After Login

Based on user role:

| Role | Redirects To | Dashboard Access |
|------|-------------|------------------|
| **USER** | `/` (homepage) | ❌ No access |
| **ANNOTATOR** | `/` (homepage) | ✅ Can navigate to `/dashboard` |
| **ADMIN** | `/` (homepage) | ✅ Can navigate to `/dashboard` + `/dashboard/users` |
| **SUPERUSER** | `/` (homepage) | ✅ Full dashboard access |

To access dashboard: Click user menu → Dashboard (or navigate to `/dashboard`)

---

## Testing the Login

### Using cURL:
```bash
# Login request
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response
{"access":"eyJ0eXAiOiJ...","refresh":"eyJ0eXAiOiJ..."}
```

### Using Frontend:
1. Navigate to `http://localhost:3000/login`
2. Enter email and password
3. Click "Login" button
4. Should redirect to homepage with user logged in
5. User info available in AuthContext

---

## Troubleshooting

### Login fails with "No active account"
- Check credentials are correct
- Verify user exists in database: `python manage.py shell` → `from core.models import User` → `User.objects.all()`
- Check user is active: `user.is_active` should be True

### Google login not working
- Verify `GOOGLE_CLIENT_ID` is set in `backend/config/settings.py`
- Check Google OAuth redirect URL matches frontend URL
- Ensure `SOCIALACCOUNT_ADAPTER` is configured

### Dashboard access denied
- Check user role: User must be ADMIN, ANNOTATOR, or SUPERUSER
- Use management command to promote: `python manage.py promote_user email --role ADMIN`

### Token expired error
- Access tokens expire after 60 minutes
- Frontend automatically refreshes using refresh token
- If refresh fails, user is logged out

---

## Environment Variables

Create `.env` file in backend directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=missland_db
DB_USER=radinamri
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT (optional - has defaults)
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
```

Create `.env.local` in frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Related Files

### Backend:
- `backend/config/urls.py` - Login endpoint configuration
- `backend/config/settings.py` - JWT settings
- `backend/core/serializers.py` - CustomTokenObtainPairSerializer
- `backend/core/views.py` - GoogleLogin view
- `backend/core/models.py` - User model with role field

### Frontend:
- `frontend/app/login/page.tsx` - Login page UI
- `frontend/context/AuthContext.tsx` - Authentication logic
- `frontend/utils/api.ts` - Axios instance with JWT interceptors
- `frontend/types/index.ts` - User and AuthTokens interfaces

---

## Quick Start (Complete Setup)

```bash
# Backend setup
cd Missland/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py promote_user admin@example.com --role ADMIN --staff
python manage.py runserver

# In new terminal - Frontend setup
cd Missland/frontend
npm install
npm run dev

# Visit http://localhost:3000/login
# Login with your superuser credentials
# Navigate to http://localhost:3000/dashboard
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/token/` | Email/password login |
| POST | `/api/token/refresh/` | Refresh access token |
| POST | `/api/auth/google/` | Google OAuth login |
| POST | `/api/auth/register/` | Create new account |
| POST | `/api/auth/logout/` | Logout (blacklist token) |
| GET | `/api/auth/me/` | Get current user with role |
| GET | `/api/auth/profile/` | Get user profile |
| POST | `/api/auth/password/change/` | Change password |

For complete API documentation, see `AUTHENTICATION_API.md`

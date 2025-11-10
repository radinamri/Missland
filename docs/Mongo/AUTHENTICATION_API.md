# Missland Authentication API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `http://<your-ip-address>:8000`

---

## Authentication Endpoints

### 1. Login (Obtain JWT Tokens)
Authenticate with email and password to receive JWT access and refresh tokens with role information.

**Endpoint**: `POST /api/token/`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**JWT Payload includes**:
- `user_id`: User ID
- `email`: User email
- `username`: Username
- `role`: User role (USER, ANNOTATOR, ADMIN, SUPERUSER)
- `is_staff`: Boolean
- `is_superuser`: Boolean
- `exp`: Token expiration (60 minutes for access token)

---

### 2. Refresh Access Token
Get a new access token using the refresh token.

**Endpoint**: `POST /api/token/refresh/`

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."  // New refresh token if rotation enabled
}
```

---

### 3. Register New User
Create a new user account.

**Endpoint**: `POST /api/auth/register/`

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "password2": "secure_password"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "email": "newuser@example.com",
    "username": "newuser@example.com"
  },
  "message": "User created successfully. You can now log in."
}
```

**Default Role**: New users are assigned `USER` role by default.

---

### 4. Google OAuth Login
Authenticate using Google OAuth access token.

**Endpoint**: `POST /api/auth/google/`

**Request Body**:
```json
{
  "access_token": "google_oauth_access_token"
}
```

**Response** (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 5. Logout (Blacklist Token)
Invalidate the refresh token to log out securely.

**Endpoint**: `POST /api/auth/logout/`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (205 Reset Content):
```json
{
  "detail": "Successfully logged out."
}
```

---

### 6. Get Current User
Retrieve current authenticated user information with role.

**Endpoint**: `GET /api/auth/me/`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "role": "ADMIN",
  "is_staff": true,
  "is_superuser": false,
  "profile_picture": "/media/profile_pictures/user.jpg"
}
```

---

### 7. Get User Profile
Get detailed profile information.

**Endpoint**: `GET /api/auth/profile/`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "has_password": true,
  "profile_picture": "/media/profile_pictures/user.jpg"
}
```

---

### 8. Change Password
Change user password (requires current password).

**Endpoint**: `POST /api/auth/password/change/`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "old_password": "current_password",
  "new_password1": "new_password",
  "new_password2": "new_password"
}
```

**Response** (200 OK):
```json
{
  "detail": "New password has been saved."
}
```

---

## Dashboard Endpoints (Role-Based Access)

### 9. List All Users (Dashboard)
Get list of all users for user management.

**Endpoint**: `GET /api/dashboard/users/`

**Required Role**: ADMIN, ANNOTATOR, or SUPERUSER

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "role": "ADMIN",
    "is_staff": true,
    "is_superuser": false,
    "date_joined": "2024-01-01T12:00:00Z"
  },
  ...
]
```

---

### 10. Update User Role
Change a user's role (admin only).

**Endpoint**: `PATCH /api/dashboard/users/<user_id>/role/`

**Required Role**: ADMIN or SUPERUSER

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "role": "ANNOTATOR"
}
```

**Valid Roles**: USER, ANNOTATOR, ADMIN

**Response** (200 OK):
```json
{
  "id": 2,
  "email": "user@example.com",
  "username": "username",
  "role": "ANNOTATOR",
  "is_staff": false,
  "is_superuser": false,
  "date_joined": "2024-01-01T12:00:00Z"
}
```

**Notes**:
- Cannot change role of superusers
- Cannot change your own role
- Only USER, ANNOTATOR, and ADMIN roles can be assigned via API
- SUPERUSER role must be set via Django admin or command line

---

### 11. Get Annotations (Dashboard)
Retrieve nail image annotations from MongoDB.

**Endpoint**: `GET /api/dashboard/annotations/`

**Required Role**: ADMIN, ANNOTATOR, or SUPERUSER

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "count": 100,
  "next": 2,
  "previous": null,
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439011",
      "image_name": "nail_001.jpg",
      "shape": "almond",
      "pattern": "french",
      "size": "medium",
      "colors": ["pink", "white"]
    },
    ...
  ]
}
```

---

### 12. Get Annotation Statistics (Dashboard)
Get distribution statistics for annotations.

**Endpoint**: `GET /api/dashboard/annotations/stats/`

**Required Role**: ADMIN, ANNOTATOR, or SUPERUSER

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "total": 1000,
  "shapes": [
    {"_id": "almond", "count": 350},
    {"_id": "coffin", "count": 250},
    ...
  ],
  "patterns": [
    {"_id": "french", "count": 400},
    {"_id": "glossy", "count": 300},
    ...
  ],
  "sizes": [
    {"_id": "medium", "count": 500},
    {"_id": "long", "count": 300},
    ...
  ]
}
```

---

## Role-Based Access Control

### Roles & Permissions

| Role | Dashboard Access | User Management | Annotations | Description |
|------|-----------------|----------------|-------------|-------------|
| **USER** | ❌ No | ❌ No | ❌ No | Regular app user |
| **ANNOTATOR** | ✅ Yes | ❌ No | ✅ Full Access | Can review and manage annotation data |
| **ADMIN** | ✅ Yes | ✅ Yes | ✅ Full Access | Full dashboard + user management |
| **SUPERUSER** | ✅ Yes | ✅ Yes | ✅ Full Access | Full system access (Django admin) |

### Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard home (requires dashboard role)
- `/dashboard/users` - User management (ADMIN/SUPERUSER only)

**Protected Routes**: Dashboard routes automatically redirect to `/login?redirect=/dashboard` if user is not authenticated or lacks required role.

---

## Management Commands

### Promote User to Admin
```bash
# Promote user to ADMIN role
python manage.py promote_user user@example.com --role ADMIN

# Promote to ADMIN with Django staff access
python manage.py promote_user user@example.com --role ADMIN --staff

# Promote to SUPERUSER with full admin rights
python manage.py promote_user user@example.com --role SUPERUSER --superuser
```

**Options**:
- `--role`: ADMIN, ANNOTATOR, or SUPERUSER
- `--staff`: Mark as Django staff (admin panel access)
- `--superuser`: Mark as Django superuser (full permissions)

---

## JWT Token Configuration

- **Access Token Lifetime**: 60 minutes
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled (new refresh token on each refresh)
- **Token Blacklisting**: Enabled (secure logout)
- **Algorithm**: HS256

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 400 Bad Request (Login)
```json
{
  "detail": "No active account found with the given credentials"
}
```

### 400 Bad Request (Logout)
```json
{
  "detail": "Token is blacklisted"
}
```

---

## Frontend Integration

### AuthContext Usage

```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, tokens, loginUser, logoutUser } = useAuth();
  
  // Check authentication
  if (!user) {
    return <div>Please login</div>;
  }
  
  // Check role
  const hasDashboardAccess = 
    user.is_staff || 
    user.is_superuser || 
    ['ADMIN', 'ANNOTATOR', 'SUPERUSER'].includes(user.role);
  
  // Login
  await loginUser({ email, password });
  
  // Logout (with token blacklisting)
  await logoutUser();
  
  return <div>Welcome {user.username} ({user.role})</div>;
}
```

### API Client

All API calls automatically include JWT token:

```typescript
import api from "@/utils/api";

// Automatically includes: Authorization: Bearer <access_token>
const response = await api.get("/api/dashboard/users/");
```

Token refresh is handled automatically on 401 errors.

---

## Setup Instructions

1. **Install dependencies**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

2. **Run migrations**:
```bash
python manage.py migrate
```

3. **Create superuser**:
```bash
python manage.py createsuperuser
```

4. **Promote to admin**:
```bash
python manage.py promote_user admin@example.com --role ADMIN --staff
```

5. **Start backend**:
```bash
python manage.py runserver
```

6. **Start frontend**:
```bash
cd frontend
npm install
npm run dev
```

7. **Access application**:
- App: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Django Admin: http://localhost:8000/admin

---

## Security Notes

- JWT tokens stored in localStorage (works for IP-based deployment)
- Refresh tokens are blacklisted on logout
- Role-based permissions enforced on backend
- Superusers cannot be demoted via API
- Users cannot change their own roles
- All dashboard endpoints require authentication
- Token refresh happens automatically on 401 errors

---

## Production Considerations

When deploying to production with HTTPS and domain:

1. Update `ALLOWED_HOSTS` in settings.py
2. Set `DEBUG = False`
3. Configure proper `SECRET_KEY` from environment
4. Consider migrating to HTTP-only cookies:
   ```python
   REST_AUTH = {
       'USE_JWT': True,
       'JWT_AUTH_HTTPONLY': True,
       'JWT_AUTH_COOKIE': 'access-token',
       'JWT_AUTH_REFRESH_COOKIE': 'refresh-token',
   }
   ```
5. Update CORS settings for your domain
6. Enable HTTPS redirects and secure cookies

# Authentication Test Guide

This document outlines all authentication flows in the Missland app and provides testing procedures.

## Overview

The app supports 5 authentication flows:
1. Email/Password Registration
2. Google OAuth Registration (New User)
3. Email/Password Login (Existing User)
4. Google OAuth Login (Existing User)
5. Google OAuth Login (New User - Auto-Register)

## Backend Architecture

### Token Management
- **Email/Password Login**: `/api/token/` - Uses `CustomTokenObtainPairView`
  - Creates a `UserSession` entry for device tracking
  - Returns: `access`, `refresh`, `session_id`, `device_name`, `device_type`

- **Google OAuth Login**: `/api/auth/google/` - Uses `GoogleLogin` (extends `SocialLoginView`)
  - Now creates a `UserSession` entry (fixed in latest commit)
  - Returns: `access`, `refresh`, `session_id`, `device_name`, `device_type`

- **Email/Password Registration**: `/api/auth/register/` - Uses `UserRegistrationView`
  - Creates user account
  - Returns: `message` and created user info
  - User must then login to get tokens

### Database Models
- **User**: Django's auth user model
- **UserSession**: Tracks device, browser, OS, IP for multi-device support
  - Fields: session_id (UUID), user, device_name, device_type, os_name, browser_name, ip_address, user_agent, is_active, created_at, last_activity_at

## Test Procedures

### Test 1: Email/Password Registration
**Flow:**
1. User visits `/register` page
2. Enters email, password, confirm password
3. Clicks "Create Account"
4. System calls `POST /api/auth/register/`
5. Backend creates user and returns success
6. Frontend automatically calls `loginUser()` with email/password
7. System calls `POST /api/token/`
8. Backend authenticates and creates `UserSession`
9. Returns tokens + session_id
10. Frontend stores in localStorage and redirects to `/`

**Expected Outcomes:**
- ✅ User created in database
- ✅ Tokens received and stored
- ✅ Session created in UserSession table
- ✅ Redirected to home page
- ✅ User can see profile
- ✅ Toast message: "Login successful!"

**Testing Steps:**
```
1. Open browser to http://localhost:3000/register
2. Enter:
   - Email: test.email@example.com
   - Password: TestPassword123!
   - Confirm: TestPassword123!
3. Click "Create Account"
4. Should redirect to home page
5. Verify user profile shows in top menu
```

---

### Test 2: Google OAuth Registration (New User)
**Flow:**
1. User visits `/register` page
2. Clicks "Continue with Google"
3. Google OAuth popup opens
4. User authenticates with Google
5. Frontend receives Google `access_token`
6. Calls `POST /api/auth/google/` with `access_token`
7. Backend:
   - Calls Google API to verify token and get user info
   - Creates new User if doesn't exist (via `allauth.CustomSocialAccountAdapter`)
   - Creates `UserSocialAccount` linking Google ID to User
   - Returns JWT tokens + session_id
8. Frontend stores tokens and redirects to `/`

**Expected Outcomes:**
- ✅ User created in database with email from Google
- ✅ SocialAccount linked in database
- ✅ Tokens received and stored
- ✅ Session created in UserSession table
- ✅ Redirected to home page
- ✅ User can see Google email as profile email

**Testing Steps:**
```
1. Open browser to http://localhost:3000/register
2. Click "Continue with Google"
3. Select a Gmail account (or use a test account)
4. Allow permissions
5. Should redirect to home page
6. Check profile shows Gmail address
7. Login should work on future visits with same Google account
```

---

### Test 3: Email/Password Login (Existing User)
**Flow:**
1. User visits `/login` page
2. Enters registered email and password
3. Clicks "Login"
4. System calls `POST /api/token/` with email + password
5. Backend:
   - Authenticates credentials
   - Creates `UserSession` entry
   - Returns tokens + session_id
6. Frontend stores and redirects to `/`

**Expected Outcomes:**
- ✅ Tokens received
- ✅ New session created (even if previously logged in)
- ✅ Redirected to home page
- ✅ Can see user profile

**Testing Steps:**
```
1. Open browser to http://localhost:3000/login
2. Enter email: test.email@example.com
3. Enter password: TestPassword123!
4. Click "Login"
5. Should redirect to home page
6. Verify profile works
```

---

### Test 4: Google OAuth Login (Existing User)
**Flow:**
1. User visits `/login` page
2. Clicks "Continue with Google"
3. Google OAuth flow occurs
4. Frontend calls `POST /api/auth/google/` with Google `access_token`
5. Backend:
   - Verifies token with Google
   - Finds existing User via `SocialAccount`
   - Creates new `UserSession` entry
   - Returns tokens + session_id
6. Frontend stores and redirects to `/`

**Expected Outcomes:**
- ✅ User authenticated (no new user created)
- ✅ New session created
- ✅ Can see user profile (same user as Test 2)
- ✅ Multiple sessions support (can be logged in from different devices)

**Testing Steps:**
```
1. Open browser (can be different device/incognito)
2. Go to http://localhost:3000/login
3. Click "Continue with Google"
4. Use SAME Google account from Test 2
5. Should redirect to home page
6. Should see same profile email
7. Open another browser/device and repeat
8. Use /api/auth/sessions/ endpoint to verify multiple sessions
```

---

### Test 5: Google OAuth Login (New User Auto-Register)
**Flow:**
1. User visits `/login` page (NOT `/register`)
2. Clicks "Continue with Google"
3. Uses a NEW Google account (never logged in before)
4. Frontend calls `POST /api/auth/google/` with Google `access_token`
5. Backend:
   - Verifies token with Google
   - User doesn't exist in database
   - `CustomSocialAccountAdapter.pre_social_login()` auto-creates new User
   - Creates `SocialAccount` linking Google ID
   - Creates `UserSession` entry
   - Returns tokens + session_id
6. Frontend stores and redirects to `/`

**Expected Outcomes:**
- ✅ New user automatically created
- ✅ Tokens received
- ✅ Session created
- ✅ Redirected to home page
- ✅ Can use app as new user

**Testing Steps:**
```
1. Open browser to http://localhost:3000/login (not /register)
2. Click "Continue with Google"
3. Use a NEW Gmail account (not used before)
4. Allow permissions
5. Should create user and redirect to home page
6. Verify profile shows new Gmail address
7. Logout and try login again with same Google account
8. Should recognize user and log in successfully
```

---

## Verification Checklist

After implementing all auth flows, verify:

- [ ] All 5 flows work without errors
- [ ] Each flow creates a `UserSession` entry
- [ ] Session IDs are returned and stored in localStorage
- [ ] Users can see their profile after login
- [ ] Multiple devices can be logged in simultaneously
- [ ] Session management endpoints work (`/api/auth/sessions/`)
- [ ] Logout properly revokes sessions
- [ ] Toast messages display correctly
- [ ] No SessionInterrupted errors in backend
- [ ] No network errors in frontend console

## Known Implementation Details

### Device Tracking
- Each login creates a `UserSession` with:
  - Device name (e.g., "Chrome on macOS")
  - Device type (mobile/tablet/desktop)
  - OS name, browser name
  - IP address and user agent
  - Activity timestamp

### Multi-Device Support
- Users can be logged in from multiple devices
- Each device gets unique `session_id`
- Tokens are valid independently per device
- Session refresh validates session_id is still active
- Users can revoke specific sessions (logout from device)
- Users can revoke all sessions (logout everywhere)

### Error Handling
- Invalid credentials: 400 Bad Request
- OAuth token invalid: 400 Bad Request with OAuth2Error
- Session expired: 401 Unauthorized
- User not found: 400 Bad Request

## Troubleshooting

### "Request failed with status code 400" on Google login
**Possible causes:**
- Invalid Google access token
- User email already in use (different Google account with same email)
- Google account disabled
- CORS misconfigured

**Solution:**
Check browser console for actual error message and backend logs

### "Session not found" error
**Possible cause:**
- Session was revoked or timed out
- session_id not passed to token refresh

**Solution:**
Ask user to log in again

### User created but login fails immediately after
**Possible cause:**
- Registration succeeded but automatic login failed
- Token endpoint down

**Solution:**
Manual login should work - this is handled by trying again

---

## Architecture Improvements Made

✅ **Session Management**: Added device tracking and multi-device support
✅ **Google OAuth**: Now creates sessions like email/password login
✅ **Session Backend**: Custom handler for concurrent deletes
✅ **Error Handling**: Graceful handling of OAuth session errors
✅ **Frontend Storage**: Session ID persisted for future requests

## Next Steps (Optional Enhancements)

- [ ] Implement "Remember This Device" (extend session timeout)
- [ ] Add "Logout from all other devices" feature
- [ ] Implement device trust/verification
- [ ] Add login activity log visible to users
- [ ] Implement passwordless login (email links)
- [ ] Add social account linking (user can link multiple Google accounts)

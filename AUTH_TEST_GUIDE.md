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
**Expected Outcomes:**
- ✅ User created in database
- ✅ Tokens received and stored
- ✅ Session created in UserSession table
- ✅ Redirected to home page
- ✅ User can see profile
- ✅ Toast message: "Login successful!"

---

### Test 2: Google OAuth Registration (New User)
**Expected Outcomes:**
- ✅ User created in database with email from Google
- ✅ SocialAccount linked in database
- ✅ Tokens received and stored
- ✅ Session created in UserSession table
- ✅ Redirected to home page
- ✅ User can see Google email as profile email

---

### Test 3: Email/Password Login (Existing User)
**Expected Outcomes:**
- ✅ Tokens received
- ✅ New session created (even if previously logged in)
- ✅ Redirected to home page
- ✅ Can see user profile

---

### Test 4: Google OAuth Login (Existing User)
**Expected Outcomes:**
- ✅ User authenticated (no new user created)
- ✅ New session created
- ✅ Can see user profile (same user as Test 2)
- ✅ Multiple sessions support (can be logged in from different devices)

---

### Test 5: Google OAuth Login (New User Auto-Register)
**Expected Outcomes:**
- ✅ New user automatically created
- ✅ Tokens received
- ✅ Session created
- ✅ Redirected to home page
- ✅ Can use app as new user

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

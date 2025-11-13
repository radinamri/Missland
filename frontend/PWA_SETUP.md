# PWA Configuration Guide

## Overview
Missland is now configured as a Progressive Web App (PWA) with offline support, installability, and app-like experience.

## Features Implemented

### 1. Service Worker (`public/sw.js`)
- **Cache Strategy:**
  - **API requests:** Network-first with cache fallback
  - **Images:** Cache-first with network fallback (7-day cache)
  - **Static assets:** Precached on install
  
- **Offline Support:**
  - Cached API responses available offline
  - Cached images served instantly
  - Graceful fallback when offline

- **Background Sync:**
  - Queues offline actions
  - Syncs when connection restored

- **Push Notifications:**
  - Ready for engagement notifications
  - Click handlers for deep linking

### 2. Web App Manifest (`public/manifest.json`)
- **App Identity:**
  - Name: "Missland - Nail Art Inspiration"
  - Theme color: Pink (#ec4899)
  - Standalone display mode

- **App Shortcuts:**
  - Home Feed
  - Saved Collections
  - Try On feature

- **Icons:** 192x192 and 512x512 PNG icons
- **Screenshots:** Mobile and desktop

### 3. PWA Components

#### `PWARegister.tsx`
- Registers service worker in production
- Handles updates (prompts user to reload)
- Manages online/offline events
- Requests notification permission (after 30s engagement)

#### `InstallPrompt.tsx`
- Smart install prompt with 30-second delay
- Dismissal with 7-day cooldown
- Beautiful gradient UI

#### `OfflineIndicator.tsx`
- Real-time connection status
- Smooth notifications when online/offline
- Auto-dismisses after 3 seconds

### 4. Mobile Optimizations

#### Touch Targets
- Minimum 44x44px for all interactive elements
- Better accessibility on mobile

#### Safe Area Insets
- Support for notched devices (iPhone X+)
- CSS classes: `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right`

#### Overscroll Prevention
- Disabled pull-to-refresh on iOS
- Better scroll experience

### 5. SEO & Metadata
- Comprehensive PWA metadata in `layout.tsx`
- Apple Web App support
- `robots.txt` for search engines
- Theme color for browser chrome

## Setup Instructions

### 1. Generate Icons
You need to create actual icon files (currently using placeholders):

```bash
# Create 192x192 icon
# Create 512x512 icon
# Place in frontend/public/
```

Recommended tools:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

### 2. Generate Screenshots
Create screenshots for app stores:
```bash
# Mobile: 390x844 (iPhone)
# Desktop: 1920x1080
# Place in frontend/public/
```

### 3. Testing PWA

#### Local Testing:
```bash
npm run build
npm run start
```

Then:
1. Open Chrome DevTools
2. Go to Application tab
3. Check "Service Workers" - should show registered
4. Check "Manifest" - should show all metadata
5. Test offline mode (throttle to "Offline" in Network tab)

#### Lighthouse Audit:
```bash
# Run in Chrome DevTools
# Lighthouse > Progressive Web App
# Should score 90+ for PWA
```

### 4. Production Deployment

The PWA features only work in production mode with HTTPS. Requirements:
- ✅ HTTPS enabled
- ✅ Valid SSL certificate
- ✅ Service worker at root (`/sw.js`)
- ✅ Manifest accessible (`/manifest.json`)

## User Experience Improvements

### Install Prompt
- Appears after 30 seconds of engagement
- Can be dismissed (won't show again for 7 days)
- One-click install to home screen

### Offline Experience
- Cached content available offline
- Clear offline indicator
- Seamless transition back online

### App-like Feel
- No browser chrome in standalone mode
- Smooth animations
- Fast loading from cache

### Performance Benefits
- **First Load:** Precached critical assets
- **Repeat Visits:** Instant loading from cache
- **Images:** 7-day cache = no re-downloads
- **API:** Network-first keeps data fresh

## Cache Management

### Cache Names:
- `missland-v1` - Precached static assets
- `missland-runtime` - API responses
- `missland-images` - Image cache
- `missland-offline-actions` - Offline queue

### Cache Invalidation:
Update the `CACHE_NAME` in `sw.js` when deploying:
```javascript
const CACHE_NAME = 'missland-v2'; // Increment version
```

Old caches are automatically deleted on activation.

## Analytics & Monitoring

After Phase 4 (Analytics Integration), you'll be able to track:
- PWA install rate
- Offline usage patterns
- Service worker performance
- Cache hit rates

## Browser Support

### Excellent Support:
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Android)
- ✅ Samsung Internet

### Limited Support:
- ⚠️ Safari (macOS) - No install prompt
- ⚠️ Firefox iOS - Uses WebKit (Safari engine)

## Troubleshooting

### Service Worker Not Registering
```bash
# Check console for errors
# Ensure running in production mode
# Verify HTTPS is enabled
# Clear browser cache and hard reload
```

### Install Prompt Not Showing
```bash
# Must be HTTPS
# Must meet PWA criteria (Lighthouse audit)
# User must have engaged with site
# Not shown if already installed
```

### Offline Mode Not Working
```bash
# Check service worker is registered
# Test with DevTools offline mode
# Verify cache is populated (Application > Cache Storage)
```

## Next Steps

### Phase 4 - Analytics Integration
Will add:
- Google Analytics 4
- Custom PWA event tracking
- Performance monitoring
- User engagement metrics

### Future Enhancements
- [ ] Push notification campaign system
- [ ] Advanced offline features (create collections offline)
- [ ] Periodic background sync
- [ ] Share target API integration
- [ ] File handling API

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## Testing Checklist

Before deployment:
- [ ] Icons generated (192x192, 512x512)
- [ ] Screenshots created (mobile + desktop)
- [ ] Lighthouse PWA score > 90
- [ ] Service worker registers correctly
- [ ] Offline mode works
- [ ] Install prompt appears
- [ ] HTTPS enabled
- [ ] Manifest accessible
- [ ] Cache strategy tested
- [ ] Cross-browser tested

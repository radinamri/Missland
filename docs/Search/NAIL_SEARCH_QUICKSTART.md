# Nail Search Integration - Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Configure Backend
```bash
# In your .env file or docker-compose.yml
export USE_MONGODB=true
export NAIL_SEARCH_API_URL=http://localhost:3000  # Update with your microservice URL
export NAIL_SEARCH_API_KEY=your_api_key_here      # Optional
```

### 2. Start Services
```bash
# Start MongoDB with replica set
docker-compose up mongodb -d

# Start backend
cd backend
python manage.py runserver

# Start frontend
cd frontend
npm run dev
```

## 🎯 How It Works

### Text Search (Existing + Enhanced)
```
User searches "blue coffin gradient"
    ↓
System finds 3 exact matches
    ↓
🤖 AI Fallback Triggered (< 10 results)
    ↓
Microservice finds 7 similar designs
    ↓
User sees 10 total results with badge:
"✨ Not enough exact matches. Showing similar designs powered by AI."
```

### Image Search (NEW)
```
User toggles to "Image" mode
    ↓
Uploads nail photo
    ↓
🤖 AI Classifies: {pattern: gradient, shape: coffin, colors: [blue, purple]}
    ↓
Filters auto-apply
    ↓
Search runs with classification
    ↓
Results displayed
```

## 📋 API Endpoints

### Backend (Django)
```bash
# Classify image
POST /api/auth/nails/classify/
Content-Type: multipart/form-data
Body: image=@nail.jpg

Response:
{
  "success": true,
  "classification": {
    "pattern": "gradient",
    "shape": "coffin", 
    "size": "medium",
    "colors": ["blue", "purple"]
  }
}

# Find similar nails
POST /api/auth/nails/search/similar/
Body: {"id": "507f1f77bcf86cd799439011", "limit": 10}

# Text search with auto-fallback
GET /api/auth/posts/filter/?pattern=gradient&shape=coffin&fallback=true

Response includes:
{
  "results": [...],
  "count": 156,
  "fallback_triggered": true,   // NEW
  "fallback_added": 7            // NEW
}
```

## 🎨 Frontend Usage

### In React Components
```typescript
import { useSearchStore } from "@/stores/searchStore";
import { classifyNailImage, findSimilarNails } from "@/utils/api";

function MyComponent() {
  const { searchMode, setSearchMode, imageFile } = useSearchStore();
  
  // Toggle search mode
  const handleModeChange = (mode: "text" | "image") => {
    setSearchMode(mode);
  };
  
  // Handle image upload
  const handleImageUpload = async (file: File) => {
    const result = await classifyNailImage(file);
    if (result.success) {
      console.log("Classification:", result.classification);
    }
  };
  
  return (
    <SearchModeToggle mode={searchMode} onChange={handleModeChange} />
  );
}
```

## 🔧 Configuration Options

### Fallback Threshold
Change when AI search triggers (default: 10 results):
```python
# backend/core/mongo_manager.py - search_with_fallback()
fallback_threshold=10  # Trigger when < 10 results
```

### Similarity Threshold
Control how similar nails must be (0-1):
```python
# backend/core/mongo_manager.py
nail_client.find_similar(
    threshold=0.7,      # 70% similarity required
    match_fields=2      # At least 2 attributes must match
)
```

### Timeouts
Adjust API timeouts:
```python
# backend/core/nail_search_client.py
self.timeout_classify = 30  # Classification timeout (seconds)
self.timeout_search = 15    # Search timeout (seconds)
```

## 🐛 Troubleshooting

### Service Unavailable
```bash
# Check if microservice is running
curl http://localhost:3000/health

# Check Django logs
docker-compose logs backend | grep -i "nail search"

# Test connection
curl -X POST http://localhost:8000/api/auth/nails/classify/ \
  -F "image=@test.jpg"
```

### Classification Not Working
```python
# Backend logs will show:
"Nail search microservice unavailable for classification"

# Frontend will show:
"Classification service unavailable"

# Solution: Falls back to text search automatically
```

### Images Not Loading
```bash
# Check MongoDB for saved images
mongo missland_db
> db.posts.find({embedding_id: {$exists: true}}).pretty()

# Verify image URLs are accessible
curl -I https://your-image-url.jpg
```

## 📊 Monitoring

### Check Fallback Usage
```python
# Query MongoDB for fallback stats
import asyncio
from backend.core.mongo_manager import get_mongo_manager

async def check_stats():
    manager = get_mongo_manager()
    result = await manager.search_with_fallback(
        pattern="gradient",
        fallback_threshold=10
    )
    print(f"Fallback triggered: {result.get('fallback_triggered')}")
    print(f"Results added: {result.get('fallback_added')}")

asyncio.run(check_stats())
```

### Frontend Analytics
```typescript
// Track image search usage
useEffect(() => {
  if (searchMode === "image") {
    console.log("User switched to image search");
    // Send to analytics
  }
}, [searchMode]);

// Track fallback triggers
if (fallbackTriggered) {
  console.log("AI fallback was triggered");
  // Send to analytics
}
```

## 🎯 User Flows

### Flow 1: Basic Image Search
1. User clicks explore page
2. Toggles to "Image" mode
3. Drags & drops nail photo
4. Sees loading spinner
5. Classification results appear
6. Filters auto-apply
7. Results load below

### Flow 2: Text Search with Fallback
1. User types "rare unique design"
2. Only 3 exact matches found
3. 🤖 AI automatically adds 7 similar
4. Pink badge shows "Showing similar designs..."
5. User sees 10 diverse results

### Flow 3: Service Down (Graceful)
1. Microservice is offline
2. User uploads image
3. Shows: "Service unavailable"
4. Falls back to manual filter selection
5. Text search continues working

## 🔐 Security Notes

### API Key (Optional)
```bash
# Add to backend .env
NAIL_SEARCH_API_KEY=your_secret_key

# Client automatically includes in headers:
X-API-Key: your_secret_key
```

### Rate Limiting
Consider adding:
```python
# Django settings
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # Limit image classification
    }
}
```

## 📈 Performance Tips

### 1. Cache Classifications
```python
# Use Redis for frequently classified images
from django.core.cache import cache

def get_cached_classification(image_hash):
    return cache.get(f"classification:{image_hash}")

def set_cached_classification(image_hash, result):
    cache.set(f"classification:{image_hash}", result, 3600)  # 1 hour
```

### 2. Lazy Load Results
Already implemented with InfiniteScroll!

### 3. Compress Images
```typescript
// Before uploading, compress image
import imageCompression from 'browser-image-compression';

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024
});
```

## 🎨 Customization

### Change Fallback Message
```typescript
// frontend/app/page.tsx
{fallbackTriggered && (
  <div className="...">
    <p>Your custom message here!</p>
  </div>
)}
```

### Adjust Classification Display
```typescript
// frontend/app/page.tsx
{classificationResult && (
  <div className="custom-style">
    {/* Customize how results are shown */}
  </div>
)}
```

## 🚀 Production Checklist

- [ ] Update `NAIL_SEARCH_API_URL` with production microservice URL
- [ ] Add `NAIL_SEARCH_API_KEY` for authentication
- [ ] Set `USE_MONGODB=true` in production env
- [ ] Configure MongoDB replica set properly
- [ ] Add MongoDB indexes (see NAIL_SEARCH_INTEGRATION.md)
- [ ] Set up image CDN for uploads
- [ ] Enable monitoring/logging
- [ ] Test fallback with < 10 results scenarios
- [ ] Load test with concurrent image uploads
- [ ] Configure proper CORS settings

## 📞 Support

If you encounter issues:
1. Check `NAIL_SEARCH_INTEGRATION.md` for detailed docs
2. Review backend logs: `docker-compose logs backend`
3. Check browser console for frontend errors
4. Verify microservice health: `curl $NAIL_SEARCH_API_URL/health`
5. Test with sample images from `backend/data/` directory

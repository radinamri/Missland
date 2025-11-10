# Real-Time Try-On Implementation Plan

## Overview
This document outlines the complete architecture and implementation plan for a real-time nail try-on feature using WebSocket streaming, connecting React frontend, Django backend, and an AI microservice.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Client   │◄───────►│  Django Backend  │◄───────►│  AI Microservice│
│  (Next.js)      │         │  (Channels)      │         │  (Try-On Model) │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
  MediaStream API              Redis Channel Layer
  Canvas/WebRTC                Message Queuing
```

---

## Technical Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **WebSocket Client**: Native WebSocket API
- **Camera Access**: MediaStream API
- **Image Processing**: Canvas API, browser-image-compression
- **State Management**: Zustand (existing)

### Backend
- **Framework**: Django 4.2+
- **WebSocket**: Django Channels 4.0+
- **Channel Layer**: Redis (channels-redis)
- **ASGI Server**: Daphne
- **Queue**: Redis Streams (optional for buffering)

### AI Microservice
- **Framework**: FastAPI (recommended) or Flask
- **WebSocket**: websockets library or FastAPI WebSocket
- **Image Processing**: OpenCV, PIL
- **Format**: WebP for efficient transfer

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Frame Rate | 25-30 FPS | Balance quality and performance |
| Latency | < 200ms | Total round-trip time |
| Frame Processing | < 100ms | Backend + AI service |
| Image Size | 30-80 KB | WebP compressed at 75% quality |
| Resolution | 640x480 - 720p | Processing resolution |

---

## Data Flow

### 1. Session Initialization
```
User → Frontend → Backend (REST API)
  ↓
Backend creates session
  ↓
Returns session_id + nail_reference_url
```

### 2. WebSocket Connection
```
Frontend connects to: ws://domain/ws/try-on/{session_id}/
  ↓
Backend validates session
  ↓
WebSocket established
  ↓
Frontend sends "ready" message
```

### 3. Frame Streaming Loop
```
Camera → Canvas → WebP compression → WebSocket → Backend
  ↓
Backend → AI Microservice (internal WS/HTTP)
  ↓
AI processes frame + nail reference
  ↓
Processed frame → Backend → WebSocket → Frontend
  ↓
Display on canvas
```

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── app/
│   └── try-on/
│       └── live/
│           └── page.tsx                 # Main try-on page
├── components/
│   ├── LiveTryOnCamera.tsx             # Camera + WebSocket client
│   ├── NailReferencePanel.tsx          # Shows nail reference
│   ├── TryOnControls.tsx               # UI controls
│   ├── ConnectionStatus.tsx            # Connection indicator
│   └── TryOnUploader.tsx               # Upload nail + source
├── hooks/
│   ├── useWebSocket.ts                 # WebSocket management
│   ├── useCameraStream.ts              # Camera access
│   ├── useImageCompression.ts          # Client-side optimization
│   └── useFullscreen.ts                # Fullscreen API
└── utils/
    ├── websocketProtocol.ts            # Message types
    └── imageProcessing.ts              # Canvas utilities
```

### Key Components

#### 1. LiveTryOnCamera Component
```typescript
interface LiveTryOnCameraProps {
  nailReferenceUrl?: string;
  onProcessedFrame: (blob: Blob) => void;
  onError: (error: Error) => void;
}

// Features:
// - Camera stream display
// - Frame capture and compression
// - WebSocket frame transmission
// - Processed frame rendering
// - Performance monitoring
```

#### 2. useWebSocket Hook
```typescript
interface UseWebSocketOptions {
  sessionId: string;
  onMessage: (data: any) => void;
  onError: (error: Error) => void;
  reconnect?: boolean;
}

// Features:
// - Connection management
// - Auto-reconnection with exponential backoff
// - Binary message handling
// - Connection state tracking
// - Heartbeat/keepalive
```

#### 3. useCameraStream Hook
```typescript
interface UseCameraStreamOptions {
  facingMode?: 'user' | 'environment';
  resolution?: { width: number; height: number };
  frameRate?: number;
}

// Features:
// - Camera permission request
// - Stream initialization
// - Frame extraction via Canvas
// - Camera switching
// - Stream cleanup
```

---

## Backend Architecture

### Django App Structure
```
backend/
├── config/
│   ├── asgi.py                        # ASGI configuration
│   ├── routing.py                     # WebSocket routing
│   └── settings.py                    # Add Channels config
├── try_on/                            # New Django app
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py                      # TryOnSession model
│   ├── serializers.py
│   ├── consumers.py                   # WebSocket consumer
│   ├── views.py                       # REST API endpoints
│   ├── urls.py
│   └── services/
│       ├── __init__.py
│       ├── session_manager.py         # Session management
│       ├── ai_client.py               # AI service client
│       └── frame_processor.py         # Frame handling
└── requirements.txt                   # Add channels, channels-redis
```

### Dependencies
```txt
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0
redis==5.0.0
Pillow==10.1.0
```

### Key Backend Components

#### 1. TryOnConsumer (WebSocket Handler)
```python
class TryOnConsumer(AsyncWebsocketConsumer):
    """
    Handles WebSocket connections for real-time try-on.
    
    Responsibilities:
    - Accept/reject connections
    - Receive camera frames
    - Forward to AI service
    - Send processed frames back
    - Handle errors and disconnections
    """
```

#### 2. TryOnSession Model
```python
class TryOnSession(models.Model):
    """
    Represents a try-on session.
    
    Fields:
    - session_id (UUID)
    - user (ForeignKey, optional)
    - nail_reference_post (ForeignKey, optional)
    - nail_reference_image (ImageField, optional)
    - created_at
    - expires_at
    - status (active, completed, error)
    - stats (JSONField: FPS, latency, frames processed)
    """
```

#### 3. AI Service Client
```python
class AITryOnClient:
    """
    Interface to communicate with AI microservice.
    
    Methods:
    - initialize_session(nail_reference)
    - process_frame(frame_data, session_id)
    - close_session(session_id)
    
    Supports:
    - WebSocket connection
    - HTTP/2 streaming
    - Request queuing
    - Timeout handling
    """
```

---

## WebSocket Message Protocol

### Client → Backend Messages

#### 1. Initialize Session
```json
{
  "type": "init_session",
  "data": {
    "nail_post_id": 123,  // Optional: from explore page
    "user_id": "uuid",
    "quality_preset": "balanced"  // "low", "balanced", "high"
  }
}
```

#### 2. Upload Nail Reference (Alternative to post_id)
```json
{
  "type": "upload_reference",
  "data": "<base64_webp_data>",
  "format": "webp",
  "filename": "reference.webp"
}
```

#### 3. Camera Frame
```typescript
// Binary message (ArrayBuffer)
{
  type: "frame",
  sequence: 1,
  timestamp: 1699564800000,
  data: ArrayBuffer  // WebP compressed image
}
```

#### 4. Control Commands
```json
{
  "type": "control",
  "action": "pause" | "resume" | "change_camera" | "adjust_quality",
  "params": {
    "camera": "front" | "back",
    "quality": "low" | "balanced" | "high"
  }
}
```

#### 5. Capture Frame
```json
{
  "type": "capture",
  "save_to_collection": true
}
```

### Backend → Client Messages

#### 1. Session Ready
```json
{
  "type": "session_ready",
  "session_id": "uuid",
  "nail_reference_url": "https://...",
  "config": {
    "target_fps": 25,
    "max_resolution": "720p"
  }
}
```

#### 2. Processed Frame
```typescript
// Binary message (ArrayBuffer)
{
  type: "processed_frame",
  sequence: 1,
  timestamp: 1699564800100,
  latency_ms: 150,
  data: ArrayBuffer  // WebP processed image with try-on overlay
}
```

#### 3. Statistics Update
```json
{
  "type": "stats",
  "fps": 25,
  "avg_latency_ms": 120,
  "frames_processed": 1500,
  "frames_dropped": 3,
  "connection_quality": "excellent"
}
```

#### 4. Error
```json
{
  "type": "error",
  "code": "AI_SERVICE_UNAVAILABLE" | "INVALID_FRAME" | "SESSION_EXPIRED",
  "message": "Detailed error message",
  "recoverable": true
}
```

#### 5. Frame Saved
```json
{
  "type": "frame_saved",
  "try_on_id": 456,
  "image_url": "https://...",
  "thumbnail_url": "https://..."
}
```

---

## Image Optimization Strategy

### Client-Side (Frontend)
1. **Capture from Canvas**
   ```javascript
   const canvas = document.createElement('canvas');
   canvas.width = 640;
   canvas.height = 480;
   const ctx = canvas.getContext('2d');
   ctx.drawImage(videoElement, 0, 0, 640, 480);
   ```

2. **Compress to WebP**
   ```javascript
   canvas.toBlob((blob) => {
     // Send blob via WebSocket
   }, 'image/webp', 0.75);  // 75% quality
   ```

3. **Frame Throttling**
   - Skip frames to maintain target FPS
   - Drop frames if backend is slow
   - Adaptive frame rate based on latency

### Backend Processing
1. **Receive Binary Data**
   ```python
   frame_data = await self.receive_bytes()
   ```

2. **Validate and Parse**
   ```python
   image = Image.open(BytesIO(frame_data))
   if image.format != 'WEBP':
       # Convert or reject
   ```

3. **Forward to AI Service**
   - Keep binary format
   - Add metadata (session_id, sequence)
   - Set timeout (200ms recommended)

4. **Return Processed Frame**
   ```python
   await self.send_bytes(processed_frame_data)
   ```

---

## Mobile UI/UX Design

### Layout (Mobile First)

#### Default View (Fullscreen Camera)
```
┌─────────────────────────────┐
│  [< Back]        [Settings] │ ← Floating header
│                             │
│                             │
│                             │
│     CAMERA FEED             │
│  (with try-on overlay)      │
│                             │
│                             │
│                             │
│  ┌─────────────────────┐   │
│  │  Nail Reference     │   │ ← Slide-up panel
│  │  [thumbnail]        │   │    (minimized)
│  └─────────────────────┘   │
│                             │
│  [◉]  [📸]  [⟲]  [⚙️]      │ ← Control bar
└─────────────────────────────┘
```

#### Expanded Reference Panel
```
┌─────────────────────────────┐
│  [< Back]        [Settings] │
│                             │
│     CAMERA FEED             │
│  (reduced height)           │
│                             │
├─────────────────────────────┤
│  Nail Reference [✕]         │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   [Large Preview]   │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Shape: Almond              │
│  Pattern: French Tips       │
│  [Change Reference]         │
├─────────────────────────────┤
│  [◉]  [📸]  [⟲]  [⚙️]      │
└─────────────────────────────┘
```

### Control Elements

#### 1. Floating Header
- **Back Button**: Returns to previous page
- **Settings Icon**: Opens settings panel
- **Connection Status**: Small indicator (🟢/🟡/🔴)

#### 2. Control Bar (Bottom)
- **Record/Pause** (◉): Toggle streaming
- **Capture** (📸): Save current frame
- **Switch Camera** (⟲): Front/back camera
- **Expand Reference** (⚙️): Show/hide reference panel

#### 3. Settings Panel (Slide-in)
- Quality preset (Low/Balanced/High)
- Frame rate adjustment
- Show performance stats
- Camera selection
- Fullscreen toggle

### States and Feedback

#### Loading States
```typescript
enum TryOnState {
  INITIALIZING = 'Requesting camera access...',
  CONNECTING = 'Connecting to server...',
  UPLOADING_REF = 'Loading nail reference...',
  READY = 'Ready to start',
  STREAMING = 'Live try-on active',
  PAUSED = 'Paused',
  PROCESSING = 'Processing frame...',
  ERROR = 'Connection lost',
  RECONNECTING = 'Reconnecting...'
}
```

#### Visual Indicators
- **Connection Quality**:
  - 🟢 Green: Excellent (<100ms)
  - 🟡 Yellow: Good (100-200ms)
  - 🔴 Red: Poor (>200ms)
- **FPS Counter**: Top-left corner (developer mode)
- **Processing Spinner**: Overlay during frame processing

---

## Entry Points

### 1. From Explore Page (with selected nail)
```typescript
// In explore page
const handleTryOn = (post: Post) => {
  router.push(`/try-on/live?postId=${post.id}`);
};
```

### 2. From Header (upload mode)
```typescript
// In header component
<button onClick={() => router.push('/try-on/live')}>
  Try On
</button>
```

### 3. Try-On Page Logic
```typescript
// /app/try-on/live/page.tsx
const params = useSearchParams();
const postId = params.get('postId');

if (postId) {
  // Mode 1: Use post image as reference + camera stream
  useEffect(() => {
    fetchPostAndInitialize(postId);
  }, [postId]);
} else {
  // Mode 2: Show upload UI for both reference and source
  <TryOnUploader 
    onReferenceUploaded={handleReferenceUpload}
    onSourceUploaded={handleSourceUpload}
  />
}
```

---

## Error Handling

### Frontend Errors
1. **Camera Permission Denied**
   - Show friendly message
   - Provide link to browser settings
   - Offer alternative: upload both images

2. **WebSocket Connection Failed**
   - Auto-retry with exponential backoff
   - Max 5 retries
   - Fallback to REST API upload

3. **Frame Processing Timeout**
   - Skip frame and continue
   - Alert user if multiple timeouts
   - Reduce quality automatically

### Backend Errors
1. **AI Service Unavailable**
   - Return error message to client
   - Queue request for retry (optional)
   - Log for monitoring

2. **Invalid Frame Data**
   - Skip frame
   - Don't break connection
   - Log validation error

3. **Session Expired**
   - Close WebSocket gracefully
   - Send error message
   - Client redirects to create new session

---

## Performance Optimization

### Frontend Optimizations
1. **Adaptive Frame Rate**
   ```javascript
   if (avgLatency > 200) {
     targetFps = Math.max(15, targetFps - 5);
   } else if (avgLatency < 100) {
     targetFps = Math.min(30, targetFps + 5);
   }
   ```

2. **Frame Skipping**
   - If backend is slow, skip sending next frame
   - Maintain queue of max 2 pending frames

3. **Resolution Scaling**
   - Start at 480p
   - Increase to 720p if latency is good
   - Decrease if latency increases

4. **Wake Lock**
   ```javascript
   const wakeLock = await navigator.wakeLock.request('screen');
   ```

### Backend Optimizations
1. **Connection Pooling**
   - Reuse connections to AI service
   - Connection pool per session

2. **Frame Buffering**
   - Small buffer (2-3 frames) for smoothing
   - Drop oldest if buffer full

3. **Async Processing**
   - Don't block on AI response
   - Use asyncio for concurrent requests

---

## Security Considerations

### Authentication
- Require authentication for try-on sessions
- Validate user_id in WebSocket connection
- Session-based token validation

### Rate Limiting
- Limit frames per second per user
- Maximum session duration (30 minutes)
- Concurrent session limit

### Data Privacy
- Don't store camera frames by default
- Only save when user explicitly captures
- Auto-delete sessions after 24 hours

### Input Validation
- Validate image format and size
- Check frame dimensions
- Sanitize file uploads

---

## Testing Strategy

### Unit Tests
- WebSocket message serialization/deserialization
- Frame compression/decompression
- Session management logic

### Integration Tests
- Full WebSocket connection flow
- Frame processing pipeline
- Error handling and recovery

### Load Tests
- Concurrent users (target: 100+)
- Sustained frame rate under load
- Memory leak detection

### Mobile Tests
- iOS Safari
- Android Chrome
- Various network conditions (WiFi, 4G, 3G)
- Battery consumption

---

## Deployment Considerations

### Infrastructure
```yaml
# docker-compose.yml addition
services:
  daphne:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8001 config.asgi:application
    ports:
      - "8001:8001"
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Nginx Configuration
```nginx
# WebSocket proxy
location /ws/ {
    proxy_pass http://daphne:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

### Scaling
- Use Redis Cluster for channel layer
- Deploy multiple Daphne instances
- Load balance WebSocket connections (sticky sessions)
- Separate AI service on GPU instances

---

## Monitoring and Analytics

### Metrics to Track
- **Performance**:
  - Average latency
  - FPS achieved
  - Frame drop rate
  - Connection duration
  
- **Usage**:
  - Sessions created
  - Frames processed
  - Captures saved
  - User engagement time
  
- **Errors**:
  - Connection failures
  - AI service errors
  - Timeout rate

### Logging
```python
logger.info(
    "Frame processed",
    extra={
        "session_id": session_id,
        "sequence": sequence,
        "latency_ms": latency,
        "user_id": user_id
    }
)
```

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- [ ] Install and configure Django Channels
- [ ] Set up Redis channel layer
- [ ] Create try_on Django app
- [ ] Implement TryOnConsumer (basic)
- [ ] Create TryOnSession model
- [ ] REST API for session creation
- [ ] Basic WebSocket echo test

### Phase 2: Frontend Core (Week 2)
- [ ] Create /app/try-on/live/page.tsx
- [ ] Implement useWebSocket hook
- [ ] Implement useCameraStream hook
- [ ] Build LiveTryOnCamera component
- [ ] Basic frame capture and send
- [ ] Display incoming frames
- [ ] Connection status UI

### Phase 3: Image Optimization (Week 3)
- [ ] Client-side WebP compression
- [ ] Frame throttling logic
- [ ] Adaptive quality adjustment
- [ ] Backend frame validation
- [ ] Performance monitoring
- [ ] Stats display

### Phase 4: UI/UX Polish (Week 4)
- [ ] NailReferencePanel component
- [ ] Fullscreen mode
- [ ] Slide-up panel animation
- [ ] Control buttons
- [ ] Settings panel
- [ ] Error states and messages
- [ ] Loading states

### Phase 5: Integration & Testing (Week 5)
- [ ] Wire explore page navigation
- [ ] Add header try-on button
- [ ] Upload mode for reference/source
- [ ] Error handling and reconnection
- [ ] Mobile responsive testing
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 6: AI Service Integration (Week 6)
- [ ] AI service client implementation
- [ ] WebSocket/HTTP communication setup
- [ ] Request queuing
- [ ] Timeout handling
- [ ] End-to-end testing
- [ ] Load testing

---

## Success Metrics

### Technical Metrics
- ✅ Achieve 25+ FPS consistently
- ✅ <200ms average latency
- ✅ <2% frame drop rate
- ✅ 99% connection success rate
- ✅ Support 100+ concurrent users

### User Experience Metrics
- ✅ <3 seconds to start streaming
- ✅ Smooth, responsive UI
- ✅ <5% user-reported errors
- ✅ High engagement (>2 min avg session)

---

## Next Steps

1. Review this plan with the team
2. Estimate development time and resources
3. Set up development environment
4. Create detailed tickets for Phase 1
5. Begin implementation

For AI microservice integration details, see [AI_MICROSERVICE_INTEGRATION.md](./AI_MICROSERVICE_INTEGRATION.md)

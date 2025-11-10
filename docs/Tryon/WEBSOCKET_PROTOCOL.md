# WebSocket Message Protocol Reference

## Overview
Complete reference for WebSocket messages used in the real-time nail try-on system across three components: React Client ↔ Django Backend ↔ AI Microservice.

---

## Connection URLs

### Client → Backend
```
ws://domain.com/ws/try-on/{session_id}/
wss://domain.com/ws/try-on/{session_id}/  (production with SSL)
```

### Backend → AI Service
```
ws://ai-service:8002/ws/tryon
```

---

## Message Format Standards

### JSON Messages
All text messages must be valid JSON with UTF-8 encoding.

```json
{
  "type": "message_type",
  "timestamp": 1699564800000,
  ...additional fields
}
```

### Binary Messages
Binary messages use a hybrid format:
1. **Metadata Header** (first 1024 bytes): JSON metadata, null-padded
2. **Binary Payload**: Image data (WebP/JPEG)

```python
# Example encoding
metadata = json.dumps({...}).encode('utf-8')
header = metadata.ljust(1024, b'\x00')
message = header + image_bytes
```

---

## Client → Backend Messages

### 1. Initialize Session (Mode: From Explore)

**When**: User arrives from explore page with selected nail post

```json
{
  "type": "init_session",
  "mode": "explore",
  "data": {
    "nail_post_id": 123,
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": 1699564800000
}
```

**Fields**:
- `type` (string, required): Always "init_session"
- `mode` (string, required): "explore" | "upload"
- `data.nail_post_id` (integer, required for explore mode): Post ID from database
- `data.user_id` (string, optional): Authenticated user ID
- `timestamp` (integer, required): Unix timestamp in milliseconds

---

### 2. Initialize Session (Mode: Upload)

**When**: User clicks "Try On" from header without selected nail

```json
{
  "type": "init_session",
  "mode": "upload",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "timestamp": 1699564800000
}
```

**Fields**:
- `mode` (string, required): "upload"
- No `nail_post_id` in upload mode

---

### 3. Upload Nail Reference

**When**: User uploads a nail image as reference (upload mode)

```json
{
  "type": "upload_reference",
  "data": "<base64_encoded_webp_data>",
  "metadata": {
    "filename": "my_nail_design.webp",
    "size_bytes": 45600,
    "format": "webp"
  },
  "timestamp": 1699564800000
}
```

**Alternative (Binary)**:
```typescript
// Send JSON metadata first
{
  "type": "upload_reference",
  "metadata": {
    "filename": "my_nail_design.webp",
    "size_bytes": 45600,
    "format": "webp"
  },
  "timestamp": 1699564800000
}

// Then send binary data separately
websocket.send(binaryImageData);
```

**Fields**:
- `data` (string, conditional): Base64 encoded image (if not using binary)
- `metadata.filename` (string, required): Original filename
- `metadata.size_bytes` (integer, required): File size
- `metadata.format` (string, required): "webp" | "jpeg" | "png"

---

### 4. Upload Source Image

**When**: User uploads their hand image instead of using camera

```json
{
  "type": "upload_source",
  "data": "<base64_encoded_webp_data>",
  "metadata": {
    "filename": "my_hand.webp",
    "size_bytes": 67800,
    "format": "webp"
  },
  "timestamp": 1699564800000
}
```

**Fields**: Same as upload_reference

---

### 5. Camera Frame

**When**: Continuously sent during live camera streaming (25-30 FPS)

**Format**: Binary message

```typescript
// TypeScript example
interface FrameMessage {
  sequence: number;
  timestamp: number;
  format: 'webp' | 'jpeg';
  width: number;
  height: number;
  quality: number;
}

// Metadata header (1024 bytes)
const metadata: FrameMessage = {
  sequence: 1,
  timestamp: Date.now(),
  format: 'webp',
  width: 640,
  height: 480,
  quality: 75
};

// Encode and send
const header = new TextEncoder().encode(
  JSON.stringify(metadata)
);
const headerPadded = new Uint8Array(1024);
headerPadded.set(header);

const message = new Uint8Array([
  ...headerPadded,
  ...new Uint8Array(frameBlob)
]);

websocket.send(message);
```

**Fields**:
- `sequence` (integer, required): Monotonically increasing frame number
- `timestamp` (integer, required): Capture time in milliseconds
- `format` (string, required): Image format
- `width` (integer, required): Frame width in pixels
- `height` (integer, required): Frame height in pixels
- `quality` (integer, required): Compression quality (1-100)

---

### 6. Control Commands

**When**: User pauses, resumes, or adjusts streaming

```json
{
  "type": "control",
  "action": "pause",
  "timestamp": 1699564800000
}
```

**Actions**:

#### Pause Streaming
```json
{
  "type": "control",
  "action": "pause",
  "timestamp": 1699564800000
}
```

#### Resume Streaming
```json
{
  "type": "control",
  "action": "resume",
  "timestamp": 1699564800000
}
```

#### Change Camera
```json
{
  "type": "control",
  "action": "change_camera",
  "params": {
    "facing": "front"  // "front" | "back"
  },
  "timestamp": 1699564800000
}
```

#### Adjust Quality
```json
{
  "type": "control",
  "action": "adjust_quality",
  "params": {
    "preset": "balanced"  // "low" | "balanced" | "high"
  },
  "timestamp": 1699564800000
}
```

---

### 7. Capture Frame

**When**: User clicks capture button to save current try-on

```json
{
  "type": "capture",
  "save_to_collection": true,
  "collection_name": "Favorite Try-Ons",
  "timestamp": 1699564800000
}
```

**Fields**:
- `save_to_collection` (boolean, optional): Save to user's collection
- `collection_name` (string, optional): Target collection name

---

### 8. Request Statistics

**When**: User opens performance stats panel

```json
{
  "type": "get_stats",
  "timestamp": 1699564800000
}
```

---

### 9. Close Session

**When**: User leaves page or closes connection

```json
{
  "type": "close_session",
  "reason": "user_navigation",
  "timestamp": 1699564800000
}
```

**Reasons**:
- `"user_navigation"`: User navigated away
- `"timeout"`: Session timeout
- `"error"`: Unrecoverable error

---

## Backend → Client Messages

### 1. Session Ready

**When**: Session initialized and ready for streaming

```json
{
  "type": "session_ready",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "nail_reference_url": "https://domain.com/media/posts/123.webp",
  "mode": "explore",
  "config": {
    "target_fps": 25,
    "max_resolution": "720p",
    "supported_formats": ["webp", "jpeg"]
  },
  "timestamp": 1699564800100
}
```

**Fields**:
- `session_id` (string, required): Unique session identifier
- `nail_reference_url` (string, required): URL of nail reference image
- `mode` (string, required): "explore" | "upload"
- `config.target_fps` (integer, required): Recommended frame rate
- `config.max_resolution` (string, required): Maximum supported resolution
- `config.supported_formats` (array, required): Supported image formats

---

### 2. Awaiting Upload

**When**: Session created in upload mode, waiting for reference image

```json
{
  "type": "awaiting_upload",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_types": ["nail_reference", "source_image"],
  "timestamp": 1699564800100
}
```

**Fields**:
- `upload_types` (array, required): What needs to be uploaded

---

### 3. Upload Acknowledged

**When**: Uploaded image received and validated

```json
{
  "type": "upload_ack",
  "upload_type": "nail_reference",
  "url": "https://domain.com/media/uploads/nail_ref_123.webp",
  "status": "success",
  "timestamp": 1699564800200
}
```

**Fields**:
- `upload_type` (string, required): "nail_reference" | "source_image"
- `url` (string, required): Stored image URL
- `status` (string, required): "success" | "failed"

---

### 4. Processed Frame

**When**: Frame processed by AI service and returned

**Format**: Binary message

```typescript
// Metadata header (JSON, 1024 bytes)
{
  "sequence": 1,
  "timestamp": 1699564800250,
  "processing_time_ms": 95,
  "confidence_score": 0.92,
  "frame_metadata": {
    "width": 640,
    "height": 480,
    "format": "webp",
    "size_bytes": 42300
  },
  "detection_info": {
    "hands_detected": 1,
    "fingertips_detected": [0, 1, 2, 3, 4],
    "overlay_applied": true
  }
}

// Followed by binary image data
```

**Fields**:
- `sequence` (integer, required): Matching client frame sequence
- `processing_time_ms` (integer, required): Total processing time
- `confidence_score` (float, required): Detection confidence (0.0-1.0)
- `detection_info` (object, required): Hand detection details
- `detection_info.hands_detected` (integer, required): Number of hands found
- `detection_info.fingertips_detected` (array, required): Which fingers detected
- `detection_info.overlay_applied` (boolean, required): Was overlay successfully applied

---

### 5. Processing Status

**When**: Frame is being processed (optional, for UX feedback)

```json
{
  "type": "processing",
  "sequence": 1,
  "status": "in_progress",
  "timestamp": 1699564800150
}
```

---

### 6. Error Messages

**When**: Any error occurs during processing

```json
{
  "type": "error",
  "code": "HAND_NOT_DETECTED",
  "message": "No hand detected in frame. Please show your hand to the camera.",
  "sequence": 1,
  "recoverable": true,
  "suggestion": "Ensure your hand is visible and well-lit",
  "timestamp": 1699564800250
}
```

**Error Codes**:

| Code | Message | Recoverable | User Action |
|------|---------|------------|------------|
| `HAND_NOT_DETECTED` | No hand detected in frame | Yes | Show hand |
| `PARTIAL_HAND_DETECTED` | Incomplete hand visible | Yes | Show all fingers |
| `LOW_LIGHT` | Lighting too low | Yes | Improve lighting |
| `BLUR_DETECTED` | Frame too blurry | Yes | Hold still |
| `INVALID_FRAME` | Frame data invalid | Yes | Retry |
| `AI_SERVICE_UNAVAILABLE` | AI service not responding | No | Try again later |
| `SESSION_EXPIRED` | Session no longer valid | No | Create new session |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Yes | Slow down |
| `UPLOAD_FAILED` | Image upload failed | Yes | Try uploading again |
| `INVALID_FORMAT` | Unsupported image format | Yes | Use WEBP/JPEG |

---

### 7. Statistics Update

**When**: Periodically sent (every 5 seconds) or on request

```json
{
  "type": "stats",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "fps": 25,
  "avg_latency_ms": 120,
  "frames_processed": 1500,
  "frames_dropped": 3,
  "frames_with_hands": 1480,
  "avg_confidence": 0.89,
  "connection_quality": "excellent",
  "session_duration_seconds": 60,
  "timestamp": 1699564800000
}
```

**Fields**:
- `fps` (integer, required): Current frames per second
- `avg_latency_ms` (integer, required): Average round-trip latency
- `frames_processed` (integer, required): Total frames processed
- `frames_dropped` (integer, required): Frames dropped due to lag
- `frames_with_hands` (integer, required): Frames with successful hand detection
- `avg_confidence` (float, required): Average confidence score
- `connection_quality` (string, required): "excellent" | "good" | "poor"
- `session_duration_seconds` (integer, required): Session length

---

### 8. Frame Saved

**When**: User's captured frame saved successfully

```json
{
  "type": "frame_saved",
  "try_on_id": 456,
  "image_url": "https://domain.com/media/try-ons/456.webp",
  "thumbnail_url": "https://domain.com/media/try-ons/456_thumb.webp",
  "collection_name": "Favorite Try-Ons",
  "timestamp": 1699564800300
}
```

**Fields**:
- `try_on_id` (integer, required): Saved try-on record ID
- `image_url` (string, required): Full image URL
- `thumbnail_url` (string, required): Thumbnail URL
- `collection_name` (string, optional): Collection where saved

---

### 9. Connection Status

**When**: Connection state changes

```json
{
  "type": "connection_status",
  "status": "connected",
  "quality": "excellent",
  "timestamp": 1699564800000
}
```

**Statuses**:
- `"connecting"`: Establishing connection
- `"connected"`: Successfully connected
- `"degraded"`: Connection issues
- `"disconnected"`: Connection lost
- `"reconnecting"`: Attempting reconnection

**Quality Levels**:
- `"excellent"`: < 100ms latency
- `"good"`: 100-200ms latency
- `"poor"`: > 200ms latency

---

### 10. Session Closed

**When**: Session closed by backend

```json
{
  "type": "session_closed",
  "reason": "timeout",
  "message": "Session expired after 30 minutes of inactivity",
  "timestamp": 1699564800000
}
```

**Reasons**:
- `"timeout"`: Session timeout
- `"admin_action"`: Closed by administrator
- `"error"`: Server error
- `"duplicate_session"`: User opened new session elsewhere

---

## Backend → AI Service Messages

### 1. Initialize Session

```json
{
  "type": "init_session",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "nail_reference": {
    "url": "https://domain.com/media/posts/123.webp",
    "post_id": 123,
    "metadata": {
      "shape": "almond",
      "pattern": "french_tips",
      "size": "medium",
      "colors": ["pink", "white"]
    }
  },
  "config": {
    "target_fps": 25,
    "quality": "balanced",
    "output_format": "webp"
  },
  "timestamp": 1699564800000
}
```

---

### 2. Process Frame

**Format**: JSON metadata + binary frame

```json
{
  "type": "process_frame",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sequence": 1,
  "timestamp": 1699564800150,
  "frame_metadata": {
    "width": 640,
    "height": 480,
    "format": "webp",
    "size_bytes": 35840
  }
}
```

---

### 3. Close Session

```json
{
  "type": "close_session",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "user_disconnected",
  "timestamp": 1699564800000
}
```

---

## AI Service → Backend Messages

### 1. Session Ready

```json
{
  "type": "session_ready",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ready",
  "model_loaded": true,
  "timestamp": 1699564800100
}
```

---

### 2. Processed Frame

**Format**: JSON metadata + binary frame

```json
{
  "type": "processed_frame",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sequence": 1,
  "timestamp": 1699564800250,
  "processing_time_ms": 95,
  "confidence_score": 0.92,
  "frame_metadata": {
    "width": 640,
    "height": 480,
    "format": "webp",
    "size_bytes": 42300
  },
  "detection_info": {
    "hands_detected": 1,
    "fingertips_detected": [0, 1, 2, 3, 4],
    "overlay_applied": true
  }
}
```

---

### 3. Error Response

```json
{
  "type": "error",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sequence": 1,
  "code": "HAND_NOT_DETECTED",
  "message": "No hand detected in frame",
  "recoverable": true,
  "timestamp": 1699564800250
}
```

---

## Implementation Examples

### React/TypeScript Client

```typescript
// types/websocket.ts
export type MessageType = 
  | 'init_session'
  | 'upload_reference'
  | 'upload_source'
  | 'control'
  | 'capture'
  | 'close_session'
  | 'session_ready'
  | 'processed_frame'
  | 'error'
  | 'stats';

export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

export interface InitSessionMessage extends BaseMessage {
  type: 'init_session';
  mode: 'explore' | 'upload';
  data: {
    nail_post_id?: number;
    user_id?: string;
  };
}

export interface SessionReadyMessage extends BaseMessage {
  type: 'session_ready';
  session_id: string;
  nail_reference_url: string;
  mode: 'explore' | 'upload';
  config: {
    target_fps: number;
    max_resolution: string;
    supported_formats: string[];
  };
}

// hooks/useWebSocket.ts
export function useWebSocket(sessionId?: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const url = `wss://${window.location.host}/ws/try-on/${sessionId}/`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    socket.onmessage = async (event) => {
      if (event.data instanceof Blob) {
        // Binary message (processed frame)
        const arrayBuffer = await event.data.arrayBuffer();
        const metadata = parseFrameMetadata(arrayBuffer);
        const imageData = arrayBuffer.slice(1024);
        handleProcessedFrame(metadata, imageData);
      } else {
        // JSON message
        const message = JSON.parse(event.data);
        handleMessage(message);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    setWs(socket);
  }, [sessionId]);

  const sendFrame = useCallback(async (blob: Blob, sequence: number) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Create metadata header
    const metadata = {
      sequence,
      timestamp: Date.now(),
      format: 'webp',
      width: 640,
      height: 480,
      quality: 75
    };

    // Encode metadata
    const metadataStr = JSON.stringify(metadata);
    const encoder = new TextEncoder();
    const metadataBytes = encoder.encode(metadataStr);
    
    // Create padded header
    const header = new Uint8Array(1024);
    header.set(metadataBytes);

    // Append image data
    const imageBytes = new Uint8Array(await blob.arrayBuffer());
    const message = new Uint8Array(header.length + imageBytes.length);
    message.set(header);
    message.set(imageBytes, header.length);

    ws.send(message);
  }, [ws]);

  return { connect, sendFrame, connected, ws };
}
```

### Python Backend Consumer

```python
# try_on/consumers.py
import json
import struct
from channels.generic.websocket import AsyncWebsocketConsumer

class TryOnConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        await self.accept()
        
        # Validate session
        if not await self.validate_session():
            await self.close()
    
    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            # JSON message
            data = json.loads(text_data)
            await self.handle_json_message(data)
        
        elif bytes_data:
            # Binary frame
            await self.handle_binary_frame(bytes_data)
    
    async def handle_json_message(self, data):
        message_type = data.get('type')
        
        if message_type == 'init_session':
            await self.initialize_session(data)
        
        elif message_type == 'upload_reference':
            await self.handle_upload(data)
        
        elif message_type == 'control':
            await self.handle_control(data)
        
        elif message_type == 'capture':
            await self.handle_capture(data)
    
    async def handle_binary_frame(self, bytes_data):
        # Parse metadata header
        metadata_bytes = bytes_data[:1024]
        metadata_str = metadata_bytes.decode('utf-8').rstrip('\x00')
        metadata = json.loads(metadata_str)
        
        # Extract image data
        image_data = bytes_data[1024:]
        
        # Forward to AI service
        result = await self.ai_client.process_frame(
            self.session_id,
            image_data,
            metadata['sequence']
        )
        
        if result:
            # Send processed frame back to client
            await self.send_processed_frame(result)
```

---

## Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to backend
wscat -c "ws://localhost:8000/ws/try-on/test-session-123/"

# Send test message
> {"type":"init_session","mode":"explore","data":{"nail_post_id":123},"timestamp":1699564800000}

# Receive response
< {"type":"session_ready","session_id":"test-session-123","nail_reference_url":"..."}
```

---

## Performance Considerations

### Message Size Optimization

| Format | Size (640x480) | Notes |
|--------|---------------|-------|
| WebP 75% | 30-50 KB | Recommended |
| WebP 85% | 50-70 KB | Higher quality |
| JPEG 75% | 40-60 KB | Fallback |
| PNG | 200-400 KB | Not recommended |

### Frame Rate vs Quality

| FPS | Bandwidth (WebP) | Use Case |
|-----|-----------------|----------|
| 15 | ~600 KB/s | Low bandwidth |
| 25 | ~1 MB/s | Balanced (recommended) |
| 30 | ~1.2 MB/s | High quality |

### Latency Budget

| Stage | Target | Maximum |
|-------|--------|---------|
| Network (client → backend) | 20ms | 50ms |
| Backend processing | 10ms | 20ms |
| AI processing | 80ms | 120ms |
| Network (backend → client) | 20ms | 50ms |
| **Total Round Trip** | **130ms** | **200ms** |

---

## Troubleshooting

### Common Issues

#### 1. Messages Not Received
- Check WebSocket connection state
- Verify JSON format is valid
- Check binary message structure

#### 2. High Latency
- Reduce image quality
- Lower frame rate
- Check network conditions

#### 3. Frames Out of Order
- Use sequence numbers
- Implement frame buffer on client

#### 4. Connection Drops
- Implement reconnection logic
- Use heartbeat/ping messages
- Check for rate limiting

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2025  
**Status**: Complete Reference

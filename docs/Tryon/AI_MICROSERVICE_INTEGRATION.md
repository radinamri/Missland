# AI Microservice Integration Guide for Try-On System

## Overview
This document provides comprehensive guidance for the AI/ML team to integrate their nail try-on model with the Django backend using WebSocket or HTTP/2 streaming for real-time frame processing.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Client   │         │  Django Backend  │         │  AI Microservice│
│                 │         │  (Try-On Gateway)│         │  (Your Service) │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. Camera frames          │                            │
         │ (WebP, 640x480, 25fps)    │                            │
         ├──────────────────────────>│                            │
         │                           │ 2. Forward frame +         │
         │                           │    nail reference          │
         │                           ├───────────────────────────>│
         │                           │                            │
         │                           │ 3. Processed frame         │
         │                           │    (try-on overlay)        │
         │                           │<───────────────────────────┤
         │ 4. Display processed      │                            │
         │    frame                  │                            │
         │<──────────────────────────┤                            │
         │                           │                            │
```

---

## Integration Options

### Option 1: WebSocket Connection (Recommended)
**Best for**: Real-time, bidirectional communication with continuous frame streaming

**Pros**:
- True full-duplex communication
- Lower overhead than HTTP
- Natural fit for streaming
- Built-in connection state

**Cons**:
- More complex to implement
- Requires WebSocket library

### Option 2: HTTP/2 Streaming
**Best for**: Simpler implementation, REST-like patterns

**Pros**:
- Easier to implement
- Better load balancer support
- Standard HTTP tooling

**Cons**:
- Higher latency than WebSocket
- More overhead per request

### Option 3: Message Queue (For Async Processing)
**Best for**: Non-real-time processing, batch operations

**Pros**:
- Decoupled architecture
- Easy to scale
- Built-in retry logic

**Cons**:
- Higher latency
- More infrastructure complexity
- Not suitable for real-time

**Recommendation**: Use **Option 1 (WebSocket)** for the primary implementation, with Option 2 as fallback.

---

## WebSocket Integration (Recommended Approach)

### Architecture

```
Django Backend                        AI Microservice
┌─────────────────┐                  ┌─────────────────┐
│ TryOnConsumer   │ ◄──WebSocket───► │ WebSocket Server│
│                 │                  │                 │
│ - Receives      │                  │ - Receives:     │
│   frames from   │                  │   * Frame data  │
│   client        │                  │   * Nail ref    │
│                 │                  │   * Session ID  │
│ - Forwards to   │                  │                 │
│   AI service    │                  │ - Returns:      │
│                 │                  │   * Processed   │
│ - Returns       │                  │     frame       │
│   processed     │                  │   * Metadata    │
│   frames        │                  │                 │
└─────────────────┘                  └─────────────────┘
```

### Message Protocol

#### Backend → AI Service

##### 1. Initialize Session
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
    "quality": "balanced",  // "low", "balanced", "high"
    "output_format": "webp"
  },
  "timestamp": 1699564800000
}
```

**Expected Response**:
```json
{
  "type": "session_ready",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ready",
  "model_loaded": true,
  "timestamp": 1699564800100
}
```

##### 2. Process Frame
```python
# Binary message with metadata header
# Format: JSON header (first 1024 bytes) + Binary image data

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
# Followed by binary WebP image data
```

**Alternative (Base64 encoded)**:
```json
{
  "type": "process_frame",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sequence": 1,
  "timestamp": 1699564800150,
  "frame_data": "base64_encoded_webp_image_data_here...",
  "frame_metadata": {
    "width": 640,
    "height": 480,
    "format": "webp"
  }
}
```

**Note**: Binary format is preferred for performance (30% smaller message size).

#### AI Service → Backend

##### 1. Processed Frame Response
```python
# Binary message with metadata header
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
    "fingertips_detected": [0, 1, 2, 3, 4],  // thumb, index, middle, ring, pinky
    "overlay_applied": true
  }
}
# Followed by binary WebP processed image data
```

##### 2. Error Response
```json
{
  "type": "error",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "sequence": 1,
  "code": "HAND_NOT_DETECTED" | "PROCESSING_FAILED" | "MODEL_ERROR",
  "message": "No hand detected in frame",
  "recoverable": true,
  "timestamp": 1699564800250
}
```

##### 3. Session Statistics
```json
{
  "type": "stats",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "frames_processed": 150,
  "avg_processing_time_ms": 92,
  "frames_with_errors": 3,
  "avg_confidence": 0.89,
  "timestamp": 1699564800000
}
```

##### 4. Close Session
```json
{
  "type": "close_session",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "user_disconnected" | "timeout" | "error",
  "timestamp": 1699564800000
}
```

---

## Python Implementation Examples

### FastAPI WebSocket Server (Recommended)

```python
# ai_service/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import asyncio
import json
import base64
from io import BytesIO
from PIL import Image
import numpy as np

app = FastAPI()

# Your AI model (pseudo-code)
class NailTryOnModel:
    def __init__(self):
        # Load your model here
        pass
    
    async def initialize_session(self, session_id: str, nail_reference: dict):
        """
        Prepare model for a new session.
        Load and preprocess nail reference image.
        """
        # Download nail reference image
        nail_img = await self.download_image(nail_reference['url'])
        
        # Store session state (nail reference, preprocessing, etc.)
        self.sessions[session_id] = {
            'nail_reference': nail_img,
            'metadata': nail_reference['metadata'],
            'preprocessed': self.preprocess_nail_reference(nail_img)
        }
        
        return True
    
    async def process_frame(self, session_id: str, frame: np.ndarray) -> tuple:
        """
        Process a single frame and apply nail try-on.
        
        Returns:
            (processed_frame, metadata) tuple
        """
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # 1. Detect hands/fingers
        hands = self.detect_hands(frame)
        
        if not hands:
            return None, {"error": "No hands detected"}
        
        # 2. Apply nail overlay
        processed = self.apply_nail_overlay(
            frame, 
            hands, 
            session['preprocessed']
        )
        
        # 3. Calculate confidence
        confidence = self.calculate_confidence(hands)
        
        metadata = {
            "hands_detected": len(hands),
            "fingertips_detected": [finger.id for finger in hands[0].fingers],
            "confidence_score": confidence,
            "overlay_applied": True
        }
        
        return processed, metadata


model = NailTryOnModel()


class ConnectionManager:
    """Manage active WebSocket connections"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)
    
    async def send_binary(self, session_id: str, data: bytes):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_bytes(data)


manager = ConnectionManager()


@app.websocket("/ws/tryon")
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for try-on processing.
    """
    session_id = None
    
    try:
        await websocket.accept()
        
        while True:
            # Receive message from Django backend
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "init_session":
                session_id = data["session_id"]
                manager.active_connections[session_id] = websocket
                
                # Initialize model for this session
                success = await model.initialize_session(
                    session_id, 
                    data["nail_reference"]
                )
                
                # Send ready response
                await websocket.send_json({
                    "type": "session_ready",
                    "session_id": session_id,
                    "status": "ready",
                    "model_loaded": success,
                    "timestamp": int(asyncio.get_event_loop().time() * 1000)
                })
            
            elif message_type == "process_frame":
                start_time = asyncio.get_event_loop().time()
                sequence = data["sequence"]
                
                # Decode frame
                if "frame_data" in data:
                    # Base64 encoded
                    frame_bytes = base64.b64decode(data["frame_data"])
                else:
                    # Binary message (receive separately)
                    frame_bytes = await websocket.receive_bytes()
                
                # Convert to image
                image = Image.open(BytesIO(frame_bytes))
                frame = np.array(image)
                
                # Process frame
                try:
                    processed_frame, metadata = await model.process_frame(
                        data["session_id"], 
                        frame
                    )
                    
                    if processed_frame is None:
                        # Send error if no hands detected
                        await websocket.send_json({
                            "type": "error",
                            "session_id": data["session_id"],
                            "sequence": sequence,
                            "code": "HAND_NOT_DETECTED",
                            "message": metadata.get("error", "Processing failed"),
                            "recoverable": True,
                            "timestamp": int(asyncio.get_event_loop().time() * 1000)
                        })
                        continue
                    
                    # Convert processed frame back to WebP
                    output = BytesIO()
                    Image.fromarray(processed_frame).save(
                        output, 
                        format='WEBP', 
                        quality=75
                    )
                    processed_bytes = output.getvalue()
                    
                    # Calculate processing time
                    processing_time = int(
                        (asyncio.get_event_loop().time() - start_time) * 1000
                    )
                    
                    # Send metadata header
                    await websocket.send_json({
                        "type": "processed_frame",
                        "session_id": data["session_id"],
                        "sequence": sequence,
                        "timestamp": int(asyncio.get_event_loop().time() * 1000),
                        "processing_time_ms": processing_time,
                        "confidence_score": metadata.get("confidence_score", 0.0),
                        "frame_metadata": {
                            "width": processed_frame.shape[1],
                            "height": processed_frame.shape[0],
                            "format": "webp",
                            "size_bytes": len(processed_bytes)
                        },
                        "detection_info": metadata
                    })
                    
                    # Send binary frame data
                    await websocket.send_bytes(processed_bytes)
                
                except Exception as e:
                    # Send error response
                    await websocket.send_json({
                        "type": "error",
                        "session_id": data["session_id"],
                        "sequence": sequence,
                        "code": "PROCESSING_FAILED",
                        "message": str(e),
                        "recoverable": False,
                        "timestamp": int(asyncio.get_event_loop().time() * 1000)
                    })
            
            elif message_type == "close_session":
                session_id = data["session_id"]
                # Clean up session
                if session_id in model.sessions:
                    del model.sessions[session_id]
                
                await websocket.send_json({
                    "type": "session_closed",
                    "session_id": session_id,
                    "timestamp": int(asyncio.get_event_loop().time() * 1000)
                })
                break
    
    except WebSocketDisconnect:
        if session_id:
            manager.disconnect(session_id)
            # Clean up session
            if session_id in model.sessions:
                del model.sessions[session_id]
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        if session_id:
            manager.disconnect(session_id)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "active_sessions": len(model.sessions) if hasattr(model, 'sessions') else 0
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

### Django Backend AI Client

```python
# backend/try_on/services/ai_client.py
import asyncio
import websockets
import json
import logging
from typing import Optional, Dict, Any
from io import BytesIO

logger = logging.getLogger(__name__)


class AITryOnClient:
    """
    Client to communicate with AI microservice via WebSocket.
    """
    
    def __init__(self, ai_service_url: str = "ws://localhost:8002/ws/tryon"):
        self.ai_service_url = ai_service_url
        self.connections: Dict[str, websockets.WebSocketClientProtocol] = {}
        self.reconnect_attempts = {}
        self.max_reconnect_attempts = 3
    
    async def initialize_session(
        self, 
        session_id: str, 
        nail_reference: Dict[str, Any]
    ) -> bool:
        """
        Initialize a try-on session with the AI service.
        
        Args:
            session_id: Unique session identifier
            nail_reference: Dict with 'url' and 'metadata'
        
        Returns:
            True if session initialized successfully
        """
        try:
            # Connect to AI service
            websocket = await websockets.connect(self.ai_service_url)
            self.connections[session_id] = websocket
            
            # Send initialization message
            init_message = {
                "type": "init_session",
                "session_id": session_id,
                "nail_reference": nail_reference,
                "config": {
                    "target_fps": 25,
                    "quality": "balanced",
                    "output_format": "webp"
                },
                "timestamp": int(asyncio.get_event_loop().time() * 1000)
            }
            
            await websocket.send(json.dumps(init_message))
            
            # Wait for ready response
            response = await asyncio.wait_for(
                websocket.recv(), 
                timeout=5.0
            )
            
            response_data = json.loads(response)
            
            if response_data.get("type") == "session_ready":
                logger.info(f"AI session {session_id} initialized")
                return True
            else:
                logger.error(f"Unexpected response: {response_data}")
                return False
        
        except Exception as e:
            logger.error(f"Failed to initialize AI session: {e}")
            return False
    
    async def process_frame(
        self, 
        session_id: str, 
        frame_data: bytes,
        sequence: int
    ) -> Optional[Dict[str, Any]]:
        """
        Send a frame to AI service for processing.
        
        Args:
            session_id: Session identifier
            frame_data: Binary image data (WebP format)
            sequence: Frame sequence number
        
        Returns:
            Dict with 'metadata' and 'frame_data' or None on error
        """
        websocket = self.connections.get(session_id)
        
        if not websocket:
            logger.error(f"No connection for session {session_id}")
            return None
        
        try:
            # Send frame metadata
            frame_message = {
                "type": "process_frame",
                "session_id": session_id,
                "sequence": sequence,
                "timestamp": int(asyncio.get_event_loop().time() * 1000),
                "frame_metadata": {
                    "format": "webp",
                    "size_bytes": len(frame_data)
                }
            }
            
            await websocket.send(json.dumps(frame_message))
            
            # Send binary frame data
            await websocket.send(frame_data)
            
            # Receive metadata response (with timeout)
            metadata_response = await asyncio.wait_for(
                websocket.recv(),
                timeout=0.2  # 200ms timeout
            )
            
            metadata = json.loads(metadata_response)
            
            if metadata.get("type") == "error":
                logger.warning(f"Frame processing error: {metadata}")
                return {
                    "error": True,
                    "metadata": metadata,
                    "frame_data": None
                }
            
            # Receive binary processed frame
            processed_frame = await asyncio.wait_for(
                websocket.recv(),
                timeout=0.2
            )
            
            return {
                "error": False,
                "metadata": metadata,
                "frame_data": processed_frame
            }
        
        except asyncio.TimeoutError:
            logger.warning(f"Frame processing timeout for session {session_id}")
            return None
        
        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return None
    
    async def close_session(self, session_id: str):
        """
        Close a try-on session.
        """
        websocket = self.connections.get(session_id)
        
        if websocket:
            try:
                close_message = {
                    "type": "close_session",
                    "session_id": session_id,
                    "reason": "user_disconnected",
                    "timestamp": int(asyncio.get_event_loop().time() * 1000)
                }
                
                await websocket.send(json.dumps(close_message))
                await websocket.close()
                
                del self.connections[session_id]
                logger.info(f"AI session {session_id} closed")
            
            except Exception as e:
                logger.error(f"Error closing AI session: {e}")
```

---

## HTTP/2 Streaming Alternative

If WebSocket is not feasible, you can use HTTP/2 with streaming responses:

### AI Service (FastAPI)

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

@app.post("/api/tryon/process-stream")
async def process_stream(
    session_id: str = Form(...),
    nail_reference_url: str = Form(...),
):
    """
    Process frames sent via streaming POST request.
    Returns streaming response with processed frames.
    """
    
    async def frame_generator():
        # Initialize session
        await model.initialize_session(session_id, {"url": nail_reference_url})
        
        # This would need to receive frames from client stream
        # and yield processed frames
        # (Implementation depends on how client sends frames)
        
        while True:
            # Receive frame from client (pseudo-code)
            frame = await receive_next_frame()
            
            if frame is None:
                break
            
            # Process frame
            processed, metadata = await model.process_frame(session_id, frame)
            
            # Yield processed frame
            yield processed.tobytes()
    
    return StreamingResponse(
        frame_generator(),
        media_type="application/octet-stream"
    )
```

**Note**: HTTP/2 streaming is more complex for bidirectional communication. WebSocket is strongly recommended for this use case.

---

## Performance Requirements

### Processing Time
- **Target**: <100ms per frame
- **Maximum**: 200ms per frame
- **At 25 FPS**: Each frame processed in 40ms or less

### Optimization Strategies

#### 1. Model Optimization
```python
# Use model quantization
model = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

# Use TensorRT or ONNX Runtime
import tensorrt as trt
# Convert model to TensorRT for faster inference
```

#### 2. Batch Processing (if applicable)
```python
# Process multiple frames in a batch
async def process_batch(frames: list):
    # Stack frames
    batch = np.stack(frames, axis=0)
    
    # Run inference on batch
    results = model.predict(batch)
    
    return results
```

#### 3. GPU Utilization
```python
import torch

# Ensure model is on GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

# Use mixed precision
from torch.cuda.amp import autocast

with autocast():
    output = model(input_tensor)
```

#### 4. Async I/O
```python
# Use async operations for I/O
async def download_image(url: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.read()
```

---

## Error Handling

### Expected Error Scenarios

#### 1. No Hand Detected
```python
if not hands_detected:
    return None, {
        "error": "HAND_NOT_DETECTED",
        "message": "Please show your hand to the camera",
        "recoverable": True
    }
```

#### 2. Partial Hand Detection
```python
if len(detected_fingers) < 3:
    return None, {
        "error": "PARTIAL_HAND_DETECTED",
        "message": "Please show all fingers",
        "recoverable": True
    }
```

#### 3. Poor Lighting
```python
if frame_brightness < threshold:
    return None, {
        "error": "LOW_LIGHT",
        "message": "Lighting is too low for accurate detection",
        "recoverable": True
    }
```

#### 4. Model Error
```python
try:
    result = model.predict(frame)
except Exception as e:
    return None, {
        "error": "MODEL_ERROR",
        "message": str(e),
        "recoverable": False
    }
```

### Error Response Format
```json
{
  "type": "error",
  "session_id": "uuid",
  "sequence": 123,
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "recoverable": true,
  "suggestion": "Try improving lighting",
  "timestamp": 1699564800000
}
```

---

## Deployment Configuration

### Docker Setup

```dockerfile
# Dockerfile for AI service
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . /app
WORKDIR /app

# Expose port
EXPOSE 8002

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "1"]
```

### Docker Compose Integration

```yaml
# docker-compose.yml
services:
  ai-tryon-service:
    build: ./ai_service
    ports:
      - "8002:8002"
    environment:
      - MODEL_PATH=/models/nail_tryon.pth
      - DEVICE=cuda  # or cpu
      - LOG_LEVEL=info
    volumes:
      - ./models:/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    networks:
      - backend
    depends_on:
      - redis

networks:
  backend:
    driver: bridge
```

---

## Monitoring and Logging

### Metrics to Track

```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
frames_processed = Counter(
    'tryon_frames_processed_total',
    'Total frames processed',
    ['session_id', 'status']
)

processing_time = Histogram(
    'tryon_processing_seconds',
    'Time spent processing frames',
    buckets=[0.01, 0.05, 0.1, 0.15, 0.2, 0.5, 1.0]
)

active_sessions = Gauge(
    'tryon_active_sessions',
    'Number of active sessions'
)

hands_detected = Counter(
    'tryon_hands_detected_total',
    'Total hands detected',
    ['num_hands']
)

# Usage
@processing_time.time()
async def process_frame(session_id, frame):
    result = await model.predict(frame)
    frames_processed.labels(session_id=session_id, status='success').inc()
    return result
```

### Logging

```python
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('tryon_service.log')
    ]
)

logger = logging.getLogger(__name__)

# Structured logging
logger.info(
    "Frame processed",
    extra={
        "session_id": session_id,
        "sequence": sequence,
        "processing_time_ms": processing_time,
        "hands_detected": len(hands),
        "confidence": confidence
    }
)
```

---

## Testing

### Unit Tests

```python
# test_model.py
import pytest
import numpy as np
from your_module import NailTryOnModel

@pytest.fixture
def model():
    return NailTryOnModel()

@pytest.fixture
def sample_frame():
    # Create a sample 640x480 RGB frame
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

@pytest.fixture
def nail_reference():
    return np.random.randint(0, 255, (100, 100, 4), dtype=np.uint8)

def test_hand_detection(model, sample_frame):
    """Test hand detection on sample frame"""
    hands = model.detect_hands(sample_frame)
    assert isinstance(hands, list)

def test_frame_processing(model, sample_frame, nail_reference):
    """Test full frame processing pipeline"""
    session_id = "test-session"
    model.sessions[session_id] = {
        'nail_reference': nail_reference,
        'preprocessed': nail_reference
    }
    
    processed, metadata = model.process_frame(session_id, sample_frame)
    
    assert processed is not None
    assert 'confidence_score' in metadata

@pytest.mark.asyncio
async def test_websocket_communication():
    """Test WebSocket message handling"""
    # Test implementation
    pass
```

### Integration Tests

```python
# test_integration.py
import pytest
import websockets
import json

@pytest.mark.asyncio
async def test_session_initialization():
    """Test full session initialization flow"""
    uri = "ws://localhost:8002/ws/tryon"
    
    async with websockets.connect(uri) as websocket:
        # Send init message
        init_msg = {
            "type": "init_session",
            "session_id": "test-123",
            "nail_reference": {
                "url": "https://example.com/nail.webp",
                "metadata": {}
            }
        }
        
        await websocket.send(json.dumps(init_msg))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        
        assert data["type"] == "session_ready"
        assert data["session_id"] == "test-123"

@pytest.mark.asyncio
async def test_frame_processing_latency():
    """Test that frame processing meets latency requirements"""
    import time
    
    # Initialize session
    # ... (initialization code)
    
    # Send test frame
    start = time.time()
    # ... (send frame)
    
    # Receive processed frame
    # ... (receive frame)
    end = time.time()
    
    latency_ms = (end - start) * 1000
    assert latency_ms < 200, f"Latency too high: {latency_ms}ms"
```

---

## Environment Variables

```bash
# .env file for AI service

# Model configuration
MODEL_PATH=/models/nail_tryon_v2.pth
MODEL_DEVICE=cuda  # or cpu
MODEL_PRECISION=fp16  # or fp32

# Performance settings
MAX_CONCURRENT_SESSIONS=50
FRAME_QUEUE_SIZE=2
TARGET_FPS=25

# WebSocket settings
WS_HOST=0.0.0.0
WS_PORT=8002
WS_MAX_MESSAGE_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/tryon_service.log

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## Security Considerations

### 1. Authentication
```python
# Validate session token
async def validate_session(session_id: str, token: str) -> bool:
    # Check with Django backend or shared Redis
    # Return True if valid
    pass

# In WebSocket handler
@app.websocket("/ws/tryon")
async def websocket_endpoint(websocket: WebSocket, token: str):
    if not await validate_session(session_id, token):
        await websocket.close(code=1008)
        return
```

### 2. Rate Limiting
```python
from collections import defaultdict
import time

rate_limits = defaultdict(list)

def check_rate_limit(session_id: str, max_requests: int = 30) -> bool:
    """Allow max_requests per second"""
    now = time.time()
    rate_limits[session_id] = [
        t for t in rate_limits[session_id] 
        if now - t < 1.0
    ]
    
    if len(rate_limits[session_id]) >= max_requests:
        return False
    
    rate_limits[session_id].append(now)
    return True
```

### 3. Input Validation
```python
def validate_frame(frame: np.ndarray) -> bool:
    """Validate frame dimensions and format"""
    if frame.shape[0] > 1080 or frame.shape[1] > 1920:
        return False
    
    if frame.dtype != np.uint8:
        return False
    
    if len(frame.shape) != 3 or frame.shape[2] != 3:
        return False
    
    return True
```

---

## FAQ

### Q: Should I use WebSocket or HTTP for this integration?
**A**: WebSocket is strongly recommended for real-time frame streaming due to lower latency and overhead. Use HTTP only if WebSocket is not feasible.

### Q: How should I handle frames when the model is slow?
**A**: Drop frames rather than buffering. Send error response with `"recoverable": true` so the client can continue sending new frames.

### Q: What image format should I use?
**A**: WebP with 75% quality provides the best balance of size and quality. JPEG is acceptable but 20-30% larger.

### Q: How do I scale for multiple users?
**A**: 
1. Run multiple instances of AI service
2. Use load balancer (with sticky sessions for WebSocket)
3. Consider GPU sharing or multiple GPUs
4. Implement request queuing with Redis

### Q: What if hand detection fails?
**A**: Send error response with `"recoverable": true` and helpful message. Don't close the connection. Client will send next frame.

### Q: How do I test without the full system?
**A**: Use the provided test scripts that simulate Django backend and React client messages.

---

## Contact and Support

For questions or issues during integration:
- **Backend Team**: [Email/Slack channel]
- **Documentation**: See main TRYON_IMPLEMENTATION_PLAN.md
- **API Testing**: Use provided Postman collection or test scripts

---

## Appendices

### Appendix A: Complete Message Types Reference

| Message Type | Direction | Format | Required Fields |
|-------------|-----------|--------|----------------|
| init_session | Django → AI | JSON | session_id, nail_reference |
| session_ready | AI → Django | JSON | session_id, status |
| process_frame | Django → AI | JSON + Binary | session_id, sequence |
| processed_frame | AI → Django | JSON + Binary | session_id, sequence, processing_time_ms |
| error | AI → Django | JSON | session_id, code, message |
| close_session | Django → AI | JSON | session_id, reason |
| stats | AI → Django | JSON | session_id, frames_processed |

### Appendix B: Error Codes

| Code | Description | Recoverable |
|------|-------------|------------|
| HAND_NOT_DETECTED | No hand in frame | Yes |
| PARTIAL_HAND_DETECTED | Incomplete hand visible | Yes |
| LOW_LIGHT | Insufficient lighting | Yes |
| BLUR_DETECTED | Frame too blurry | Yes |
| MODEL_ERROR | Model inference failed | No |
| INVALID_SESSION | Session not found | No |
| PROCESSING_TIMEOUT | Processing took too long | Yes |

### Appendix C: Nail Reference Metadata Schema

```typescript
interface NailReferenceMetadata {
  shape: 'almond' | 'square' | 'oval' | 'stiletto' | 'coffin' | 'round';
  pattern: 'solid' | 'french_tips' | 'ombre' | 'glitter' | 'marble' | 'floral';
  size: 'short' | 'medium' | 'long';
  colors: string[];  // e.g., ['pink', 'white', 'gold']
  finish: 'matte' | 'glossy' | 'metallic';
}
```

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2025  
**Status**: Ready for Implementation

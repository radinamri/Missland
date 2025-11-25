# Frontend Integration Guide

Complete API documentation for integrating the Nail RAG Service with your frontend application.

## Base URL

```
Development: http://localhost:8000
Production: https://your-domain.com
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## API Endpoints

### 1. Health Check

**GET** `/health`

Check if the service is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "system_ready": true,
  "components": {
    "weaviate": true,
    "openai": true
  }
}
```

---

### 2. Create Conversation

**POST** `/api/chat/conversation`

Create a new conversation session.

**Request Body:**
```json
{
  "user_id": "user_123"  // Optional
}
```

**Response:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:8000/api/chat/conversation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 'user_123'  // Optional
  })
});

const data = await response.json();
const conversationId = data.conversation_id;
```

---

### 3. Send Chat Message

**POST** `/api/chat/message`

Send a text message and get a RAG-powered response.

**Request Body:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What nail color suits fair skin?",
  "user_id": "user_123"  // Optional
}
```

**Response:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message_id": "msg_abc123",
  "answer": "For fair skin, I recommend soft pink, nude, or light coral shades...",
  "language": "en",
  "context_sources": [
    {
      "title": "Top 5 Fair Skin",
      "category": "Skin Tone",
      "score": 0.89
    }
  ],
  "image_analyzed": false,
  "tokens_used": 250,
  "error": null
}
```

**Example (JavaScript):**
```javascript
const response = await fetch('http://localhost:8000/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    conversation_id: conversationId,
    message: 'What nail color suits fair skin?',
    user_id: 'user_123'
  })
});

const data = await response.json();
console.log('Answer:', data.answer);
```

---

### 4. Upload Image with Message

**POST** `/api/chat/image`

Upload a nail image with an optional message for analysis and advice.

**Request:** `multipart/form-data`

**Form Fields:**
- `conversation_id` (string, required): Conversation UUID
- `message` (string, optional): Optional message text
- `user_id` (string, optional): Optional user ID
- `image` (file, required): Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message_id": "msg_abc123",
  "answer": "Based on your nail image, I recommend...",
  "image_analysis": "The image shows almond-shaped nails with a soft pink polish...",
  "language": "en",
  "context_sources": [],
  "tokens_used": 350,
  "error": null
}
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('conversation_id', conversationId);
formData.append('message', 'What nail shape and color would suit me?');
formData.append('image', imageFile);  // File from input[type="file"]

const response = await fetch('http://localhost:8000/api/chat/image', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Answer:', data.answer);
console.log('Image Analysis:', data.image_analysis);
```

**Example (React):**
```jsx
const handleImageUpload = async (file, conversationId) => {
  const formData = new FormData();
  formData.append('conversation_id', conversationId);
  formData.append('message', 'Analyze my nails');
  formData.append('image', file);

  try {
    const response = await fetch('http://localhost:8000/api/chat/image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};
```

---

### 5. Get Conversation History

**GET** `/api/chat/conversation/{conversation_id}/history`

Retrieve the conversation history.

**Path Parameters:**
- `conversation_id` (string): Conversation UUID

**Response:**
```json
{
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "messages": [
    {
      "role": "user",
      "content": "What nail color suits fair skin?",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "For fair skin, I recommend...",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ],
  "message_count": 2
}
```

**Example (JavaScript):**
```javascript
const response = await fetch(
  `http://localhost:8000/api/chat/conversation/${conversationId}/history`
);
const data = await response.json();
console.log('Messages:', data.messages);
```

---

### 6. Clear Conversation

**DELETE** `/api/chat/conversation/{conversation_id}`

Clear conversation from short-term memory.

**Path Parameters:**
- `conversation_id` (string): Conversation UUID

**Response:**
```json
{
  "message": "Conversation cleared",
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## WebSocket API

### WebSocket Connection

**WebSocket** `/ws/chat/{conversation_id}`

Real-time streaming chat with token-by-token response delivery.

**Connection:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/chat/${conversationId}`);

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'start':
      console.log('Response started');
      break;
    case 'token':
      // Append token to UI
      appendTokenToUI(message.token);
      break;
    case 'complete':
      console.log('Full response:', message.full_response);
      break;
    case 'error':
      console.error('Error:', message.message);
      break;
    case 'pong':
      // Response to ping
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

### Send Message via WebSocket

**Message Format:**
```json
{
  "type": "message",
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What nail color suits fair skin?",
  "user_id": "user_123"  // Optional
}
```

**Send Message:**
```javascript
ws.send(JSON.stringify({
  type: 'message',
  conversation_id: conversationId,
  message: 'What nail color suits fair skin?',
  user_id: 'user_123'
}));
```

### Send Image via WebSocket

**Message Format:**
```json
{
  "type": "image",
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Analyze my nails",  // Optional
  "image_data": "base64_encoded_image_string",
  "user_id": "user_123"  // Optional
}
```

**Example:**
```javascript
// Convert image to base64
const reader = new FileReader();
reader.onloadend = () => {
  const base64Image = reader.result.split(',')[1];  // Remove data:image/...;base64, prefix
  
  ws.send(JSON.stringify({
    type: 'image',
    conversation_id: conversationId,
    message: 'Analyze my nails',
    image_data: base64Image,
    user_id: 'user_123'
  }));
};
reader.readAsDataURL(imageFile);
```

### Ping/Pong

Send ping to keep connection alive:

```javascript
ws.send(JSON.stringify({
  type: 'ping'
}));
```

Server responds with `{"type": "pong"}`.

---

## Complete React Example

```jsx
import React, { useState, useEffect, useRef } from 'react';

function NailRAGChat() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  // Create conversation on mount
  useEffect(() => {
    createConversation();
  }, []);

  const createConversation = async () => {
    const response = await fetch('http://localhost:8000/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    setConversationId(data.conversation_id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: input
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer
      }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!conversationId) return;

    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('image', file);
    formData.append('message', 'Analyze my nails');

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '📷 [Image uploaded]' },
        { role: 'assistant', content: data.answer }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about nail design..."
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default NailRAGChat;
```

---

## WebSocket Streaming Example (React)

```jsx
import React, { useState, useEffect, useRef } from 'react';

function StreamingChat() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    createConversation();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const createConversation = async () => {
    const response = await fetch('http://localhost:8000/api/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    setConversationId(data.conversation_id);
    connectWebSocket(data.conversation_id);
  };

  const connectWebSocket = (convId) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${convId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'start':
          setCurrentResponse('');
          break;
        case 'token':
          setCurrentResponse(prev => prev + message.token);
          break;
        case 'complete':
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: message.full_response
          }]);
          setCurrentResponse('');
          break;
        case 'error':
          console.error('Error:', message.message);
          break;
      }
    };
  };

  const sendMessage = (text) => {
    if (!wsRef.current || !text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);

    wsRef.current.send(JSON.stringify({
      type: 'message',
      conversation_id: conversationId,
      message: text
    }));
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role}>
            {msg.content}
          </div>
        ))}
        {currentResponse && (
          <div className="assistant streaming">
            {currentResponse}
            <span className="cursor">▋</span>
          </div>
        )}
      </div>
      {/* Input component */}
    </div>
  );
}
```

---

## Error Handling

All endpoints may return errors in the following format:

```json
{
  "detail": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found (conversation not found)
- `500`: Internal Server Error

**Example Error Handling:**
```javascript
try {
  const response = await fetch('http://localhost:8000/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id, message })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error in UI
}
```

---

## Response Fields

### Chat Response Fields

- `conversation_id` (string): Conversation UUID
- `message_id` (string): Message UUID
- `answer` (string): Generated answer
- `language` (string): Detected language code ("en", "fi", "sv")
- `context_sources` (array): Source documents used
  - `title` (string): Document title
  - `category` (string): Document category
  - `score` (number): Relevance score (0-1)
- `image_analyzed` (boolean): Whether image was analyzed
- `tokens_used` (number): Tokens consumed
- `error` (string|null): Error message if any

---

## Best Practices

1. **Conversation Management**: Create a conversation once per session, reuse the `conversation_id`
2. **Error Handling**: Always handle errors and show user-friendly messages
3. **Loading States**: Show loading indicators during API calls
4. **Image Optimization**: Compress images before upload (max 5MB recommended)
5. **WebSocket Reconnection**: Implement reconnection logic for WebSocket connections
6. **Rate Limiting**: Be mindful of API rate limits (implement client-side throttling if needed)

---

## CORS Configuration

The API supports CORS. Configure allowed origins in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

Or use `*` for development (not recommended for production).

---

## Rate Limits

Currently, there are no rate limits implemented. Consider implementing client-side throttling for production use.

---

## Support

For API issues or questions:
- Check API documentation: `http://localhost:8000/docs`
- Review server logs for detailed error messages
- Ensure Weaviate and OpenAI services are properly configured


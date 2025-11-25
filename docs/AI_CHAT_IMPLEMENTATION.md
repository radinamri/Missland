# AI Stylist Chat - Implementation Guide

## Overview

The AI Stylist chat feature is a fully-functional AI assistant that helps users with nail design recommendations, image analysis, and personalized styling advice. It integrates with a FastAPI backend (Nail RAG Service) using RAG (Retrieval-Augmented Generation) for contextual responses.

## Features Implemented

### ✅ Core Functionality
- **Real-time messaging** with AI assistant
- **Image upload and analysis** for nail designs
- **Conversation persistence** across sessions
- **Chat history management** (pin, delete, rename)
- **Authentication-gated history** - works without login, history saved for logged-in users
- **Error handling** with user-friendly UI
- **File validation** (JPEG, PNG, WebP, max 5MB)
- **Loading states** and typing indicators
- **Responsive design** with mobile-optimized sidebar

### 🎨 UI/UX Features
- Brand-consistent color palette (#3D5A6C, #D98B99)
- Smooth animations and transitions
- Custom scrollbar styling
- Error banner notifications
- Login prompt for history access
- Empty state with hero section
- Pinned conversations
- Search functionality for history
- Active conversation highlighting

## Architecture

### Components Structure

```
frontend/
├── app/chat/page.tsx          # Main chat page component
├── utils/chatApi.ts           # API service functions
├── context/AuthContext.tsx    # Authentication context (existing)
├── components/
│   ├── LoginModal.tsx         # Login modal (existing)
│   └── SignUpPopup.tsx        # Signup popup (existing)
└── .env.local.example         # Environment variables template
```

### State Management

**Chat State:**
- `messages`: Current conversation messages
- `conversationId`: Active conversation UUID
- `history`: Array of saved chat sessions (localStorage)
- `currentSessionId`: Active session identifier
- `isTyping`: AI response loading indicator
- `isLoading`: API call in progress
- `error`: Error message display

**Authentication Integration:**
- Uses `useAuth()` hook from AuthContext
- Checks `user` for logged-in status
- Shows LoginModal for history access
- Saves history per user ID in localStorage

### Data Flow

```
User Input → API Service → FastAPI Backend → RAG System → Response
                ↓
        Update Messages State
                ↓
        Auto-save to History (if logged in)
                ↓
        LocalStorage Persistence
```

## API Integration

### Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/conversation` | Create new conversation |
| POST | `/api/chat/message` | Send text message |
| POST | `/api/chat/image` | Upload image for analysis |
| GET | `/api/chat/conversation/{id}/history` | Fetch conversation history |
| DELETE | `/api/chat/conversation/{id}` | Clear conversation |
| GET | `/health` | Check service health |

### API Service (`utils/chatApi.ts`)

**Key Functions:**
- `createConversation(userId?)` - Initialize new chat
- `sendMessage(conversationId, message, userId?)` - Send text
- `uploadImage(conversationId, file, message?, userId?)` - Upload image
- `validateImageFile(file)` - Client-side validation

**Error Handling:**
All functions throw descriptive errors that are caught and displayed in the UI.

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in the `frontend` directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2. Backend Requirements

The chat feature requires the FastAPI backend (Nail RAG Service) to be running on port 8000.

**Backend must provide:**
- Weaviate vector database
- OpenAI API integration
- RAG system for context retrieval
- Image analysis capability

**Check backend health:**
```bash
curl http://localhost:8000/health
```

Expected response:
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

### 3. Run Frontend

```bash
cd frontend
npm run dev
```

Navigate to: `http://localhost:3000/chat`

## User Flows

### Non-Logged-In User
1. Visit `/chat` page
2. Can send messages and upload images
3. Sees "Log in for history" button in sidebar
4. Clicking sidebar history area shows login prompt
5. No history persistence (resets on refresh)

### Logged-In User
1. Visit `/chat` page
2. Full access to all features
3. Chat history automatically saved to localStorage
4. Can search, pin, rename, delete conversations
5. History persists across sessions
6. Active conversation highlighted

### Conversation Management
1. **New Chat**: Creates fresh conversation with new UUID
2. **Load Session**: Restores messages and conversation ID
3. **Pin**: Moves conversation to top of list
4. **Rename**: Click menu → Rename → Edit inline
5. **Delete**: Removes from history, creates new chat if active

### Image Upload
1. Click paperclip icon
2. File picker opens (JPEG/PNG/WebP only)
3. Client-side validation (type, size)
4. Upload to API with FormData
5. Display response with image analysis section

## Data Persistence

### LocalStorage Structure

**Key:** `chat_history_${userId}`

**Value:**
```typescript
ChatSession[] = [
  {
    id: string,              // Unique session ID
    conversationId: string,  // API conversation UUID
    title: string,           // Auto-generated from first message
    preview: string,         // Last message snippet
    date: string,           // Formatted date
    isPinned: boolean,      // Pin status
    messages: Message[]     // Full conversation history
  }
]
```

### Auto-Save Logic
- Triggers on every message update
- Creates new session if none exists
- Updates existing session if found
- Generates title from first user message
- Limits title to 30 characters with ellipsis

## Error Handling

### Error Banner Component
Displays at top of screen with:
- Red border accent
- AlertCircle icon
- Error message
- Dismiss button
- Auto-dismiss on user action

### Error Sources
1. **API Errors**: Network failures, server errors
2. **Validation Errors**: Invalid file type/size
3. **Initialization Errors**: Failed conversation creation
4. **Upload Errors**: Image processing failures

### Error Messages
- Descriptive and user-friendly
- Suggest remedial actions
- Clear dismissal options
- Don't expose technical details

## Styling

### Color Palette
- **Primary**: `#3D5A6C` (dark blue-gray)
- **Accent**: `#D98B99` (dusty rose)
- **Background**: `#F9FAFB` (light gray)
- **White**: `#FFFFFF`
- **Text**: `#3D5A6C` (primary)
- **Muted**: `#9CA3AF` (gray-400)

### Custom Classes
- `.custom-scrollbar` - Styled scrollbar for sidebar
- `.animate-in` - Entrance animations
- `.fade-in` - Fade entrance
- `.slide-in-from-*` - Directional slide

### Responsive Breakpoints
- Mobile: < 768px (full-screen sidebar overlay)
- Desktop: ≥ 768px (sidebar alongside chat)

## Testing Checklist

### Functional Tests
- [ ] Send text message
- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Reject invalid file types
- [ ] Reject files > 5MB
- [ ] Create new chat
- [ ] Load existing session
- [ ] Pin conversation
- [ ] Unpin conversation
- [ ] Rename conversation
- [ ] Delete conversation
- [ ] Search history
- [ ] Error banner display
- [ ] Error banner dismiss

### Authentication Tests
- [ ] Chat works without login
- [ ] Login prompt shows for non-logged-in users
- [ ] History saves for logged-in users
- [ ] History loads on page refresh
- [ ] Different users have separate histories
- [ ] Logout clears active session

### UI/UX Tests
- [ ] Typing indicator shows
- [ ] Loading states disable inputs
- [ ] Sidebar animation smooth
- [ ] Mobile overlay works
- [ ] Scrolling smooth
- [ ] Active session highlighted
- [ ] Empty state displays
- [ ] Hero section renders

### Edge Cases
- [ ] Network failure handling
- [ ] Backend unavailable
- [ ] Conversation initialization failure
- [ ] Large message handling
- [ ] Long conversation history
- [ ] Rapid message sending
- [ ] Image upload during typing
- [ ] Session restore after error

## Performance Considerations

### Optimization Strategies
1. **LocalStorage**: Only save for logged-in users
2. **Message Batching**: Single API call per message
3. **Image Validation**: Client-side before upload
4. **Lazy Loading**: Conversation history loaded from localStorage
5. **Debouncing**: Search input (not yet implemented, can add)

### Future Enhancements
- [ ] WebSocket streaming for real-time responses
- [ ] Pagination for large history
- [ ] Image thumbnails in messages
- [ ] Export conversation feature
- [ ] Share conversation link
- [ ] Voice input support
- [ ] Message reactions
- [ ] Context sources display

## Troubleshooting

### Chat Not Loading
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `.env.local` has correct `NEXT_PUBLIC_CHAT_API_URL`
3. Check browser console for errors
4. Clear localStorage: `localStorage.clear()`

### Images Not Uploading
1. Check file type (JPEG/PNG/WebP only)
2. Check file size (< 5MB)
3. Verify backend image endpoint: `POST /api/chat/image`
4. Check network tab for upload errors

### History Not Saving
1. Confirm user is logged in
2. Check localStorage key: `chat_history_${userId}`
3. Verify `user.id` exists in AuthContext
4. Clear and retry: `localStorage.removeItem('chat_history_...')`

### Error Banner Stuck
1. Click X button to dismiss
2. Refresh page to clear
3. Check `error` state in React DevTools

## API Documentation Reference

Full API documentation: `/docs/FRONTEND_INTEGRATION.md`

Key sections:
- Authentication (optional for chat)
- Request/Response formats
- Error codes
- Rate limits (none currently)
- CORS configuration

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend health endpoint
3. Review this documentation
4. Check API documentation
5. Contact development team

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Production Ready

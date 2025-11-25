# AI Stylist Chat - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    app/chat/page.tsx                             │  │
│  │  - Main Chat Component                                           │  │
│  │  - Message Display                                               │  │
│  │  - Sidebar with History                                          │  │
│  │  - Input Area with Upload                                        │  │
│  │  - Error Banner                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ↓ uses                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  context/AuthContext.tsx                         │  │
│  │  - User Authentication State                                     │  │
│  │  - Login/Logout Functions                                        │  │
│  │  - Token Management                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ↓ uses                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    utils/chatApi.ts                              │  │
│  │  - createConversation()                                          │  │
│  │  - sendMessage()                                                 │  │
│  │  - uploadImage()                                                 │  │
│  │  - validateImageFile()                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ↓ HTTP                                        │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI @ localhost:8000)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     API Endpoints                                │  │
│  │  POST /api/chat/conversation    → Create new conversation        │  │
│  │  POST /api/chat/message         → Send text message              │  │
│  │  POST /api/chat/image           → Upload & analyze image         │  │
│  │  GET  /health                   → Health check                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ↓                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   RAG System (Nail Design)                       │  │
│  │  - Context Retrieval                                             │  │
│  │  - OpenAI Integration                                            │  │
│  │  - Image Analysis                                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ↓                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Weaviate Vector Database                        │  │
│  │  - Nail Design Documents                                         │  │
│  │  - Semantic Search                                               │  │
│  │  - Context Sources                                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Browser LocalStorage                            │  │
│  │                                                                  │  │
│  │  Key: chat_history_${userId}                                     │  │
│  │  Value: ChatSession[]                                            │  │
│  │    - id: string                                                  │  │
│  │    - conversationId: string (from backend)                       │  │
│  │    - title: string                                               │  │
│  │    - messages: Message[]                                         │  │
│  │    - isPinned: boolean                                           │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User Types Message                                                     │
│         ↓                                                               │
│  Input Validation                                                       │
│         ↓                                                               │
│  chatApi.sendMessage() → POST /api/chat/message                         │
│         ↓                                                               │
│  Backend RAG Processing                                                 │
│         ↓                                                               │
│  Response with Answer + Context                                         │
│         ↓                                                               │
│  Update Messages State                                                  │
│         ↓                                                               │
│  Auto-save to History (if logged in)                                    │
│         ↓                                                               │
│  Persist to LocalStorage                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Non-Logged-In User                    Logged-In User                   │
│  ┌─────────────────┐                  ┌─────────────────┐              │
│  │ Access Chat     │                  │ Access Chat     │              │
│  │ Send Messages   │                  │ Send Messages   │              │
│  │ Upload Images   │                  │ Upload Images   │              │
│  │ No History      │                  │ Full History    │              │
│  │ See Login Prompt│                  │ Pin/Delete/Rename│             │
│  └─────────────────┘                  │ Search History  │              │
│         ↓                             │ Auto-save       │              │
│  Click History                        └─────────────────┘              │
│         ↓                                                               │
│  Show Login Modal                                                       │
│         ↓                                                               │
│  Authenticate                                                           │
│         ↓                                                               │
│  Gain History Access                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  API Call                                                               │
│      ↓                                                                  │
│  try/catch Block                                                        │
│      ↓                                                                  │
│  Error Detected? → Yes → Set Error State                               │
│      ↓                         ↓                                        │
│     No                   Error Banner Displays                          │
│      ↓                         ↓                                        │
│  Success Response        User Dismisses                                 │
│      ↓                         ↓                                        │
│  Update UI             Clear Error State                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  AIStylistPage                                                          │
│  ├── ErrorBanner (conditional)                                          │
│  ├── LoginModal (conditional)                                           │
│  ├── Sidebar                                                            │
│  │   ├── Search Input                                                   │
│  │   ├── New Chat Button                                                │
│  │   ├── History List                                                   │
│  │   │   ├── Chat Item                                                  │
│  │   │   │   ├── Title & Date                                           │
│  │   │   │   ├── Pin Icon (conditional)                                 │
│  │   │   │   └── Menu (Rename/Pin/Delete)                               │
│  │   │   └── ... more items                                             │
│  │   └── Login Prompt (if not logged in)                                │
│  ├── Main Chat Area                                                     │
│  │   ├── Open Sidebar Button                                            │
│  │   ├── Hero Section (if no messages)                                  │
│  │   └── Messages Container                                             │
│  │       ├── Message Bubbles                                            │
│  │       │   ├── Avatar                                                 │
│  │       │   ├── Name                                                   │
│  │       │   ├── Content                                                │
│  │       │   └── Image Analysis (conditional)                           │
│  │       └── Typing Indicator (conditional)                             │
│  └── Input Area                                                         │
│      ├── File Input (hidden)                                            │
│      ├── Paperclip Button                                               │
│      ├── Textarea                                                       │
│      └── Send Button                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  useState Hooks:                                                        │
│  ├── messages: Message[]              - Current conversation            │
│  ├── input: string                    - Textarea value                  │
│  ├── conversationId: string | null    - Active conversation UUID        │
│  ├── history: ChatSession[]           - Saved conversations             │
│  ├── currentSessionId: string | null  - Active session ID               │
│  ├── isTyping: boolean                - AI typing indicator             │
│  ├── isLoading: boolean               - API call in progress            │
│  ├── error: string | null             - Error message                   │
│  ├── isSidebarOpen: boolean           - Sidebar visibility              │
│  ├── searchQuery: string              - History search                  │
│  ├── showLoginModal: boolean          - Login modal visibility          │
│  └── ... menu & rename states                                           │
│                                                                         │
│  useRef Hooks:                                                          │
│  ├── inputRef: textarea               - Input auto-resize               │
│  ├── scrollRef: div                   - Auto-scroll to bottom           │
│  ├── fileInputRef: input              - File upload trigger             │
│  └── menuRef: div                     - Click-outside detection         │
│                                                                         │
│  useContext:                                                            │
│  └── useAuth()                        - User & authentication           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Features Visualization

### Message Flow
```
User → Input → Validate → API → Backend → RAG → Response → UI → Storage
```

### Authentication Gate
```
┌─────────────┐
│  User?      │
└──────┬──────┘
       │
       ├─ Yes → Full Access → History Saved
       │
       └─ No  → Can Chat   → No History → Login Prompt
```

### Error Recovery
```
API Error → Catch → Display Banner → User Dismisses → Retry/Continue
```

### History Management
```
Message Sent → Auto-save → LocalStorage
                  ↓
            Load on Mount
                  ↓
          Display in Sidebar
```

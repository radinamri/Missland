/**
 * AI Stylist Chat Page
 * 
 * Full-featured chat interface with FastAPI backend integration (Nail RAG Service)
 * 
 * Features:
 * - Real-time messaging with AI assistant
 * - Image upload and analysis (JPEG/PNG/WebP, max 5MB)
 * - Authentication-gated chat history (works without login, saves for logged-in users)
 * - Conversation management (pin, delete, rename)
 * - Error handling with user-friendly UI
 * - LocalStorage persistence per user
 * 
 * Authentication Flow:
 * - Non-logged-in: Can chat, no history saved, sees login prompt for history
 * - Logged-in: Full history access, auto-save to localStorage per user ID
 * 
 * API Endpoints (FastAPI @ localhost:8000):
 * - POST /api/chat/conversation - Create conversation
 * - POST /api/chat/message - Send message
 * - POST /api/chat/image - Upload image
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_CHAT_API_URL - FastAPI backend URL (default: http://localhost:8000)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  Plus,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  Search,
  MoreVertical,
  Pencil,
  Pin,
  Trash2,
  Check,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  createConversation,
  sendMessage,
  uploadImage,
  validateImageFile,
} from "@/utils/chatApi";

// --- Types ---
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image_analysis?: string;
};

type ChatSession = {
  id: string;
  conversationId: string;
  title: string;
  preview: string;
  date: string;
  isPinned?: boolean;
  messages: Message[];
};

export default function AIStylistPage() {
  const { user } = useAuth();
  
  // --- State ---
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showHistoryLoginPrompt, setShowHistoryLoginPrompt] = useState(false);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Chat History State (persisted in localStorage for logged-in users)
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Load chat history from localStorage ---
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`chat_history_${user.id}`);
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed.map((session: ChatSession) => ({
            ...session,
            messages: session.messages.map((msg: Message) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })));
        } catch (error) {
          console.error("Failed to parse chat history:", error);
        }
      }
    } else {
      // For non-logged-in users, clear history display
      setHistory([]);
    }
  }, [user]);

  // --- Save chat history to localStorage ---
  useEffect(() => {
    if (user && history.length > 0) {
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(history));
    }
  }, [history, user]);

  // --- Create conversation on mount ---
  useEffect(() => {
    const initConversation = async () => {
      try {
        const response = await createConversation(user?.id?.toString());
        setConversationId(response.conversation_id);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        setError("Failed to initialize chat. Please refresh the page.");
      }
    };
    initConversation();
  }, [user]);

  // --- Effects ---
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Auto-save current conversation to history ---
  useEffect(() => {
    if (messages.length > 0 && conversationId && user) {
      const sessionId = currentSessionId || Date.now().toString();
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }

      const firstUserMessage = messages.find((m) => m.role === "user")?.content || "New Chat";
      const title = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? "..." : "");
      const preview = messages[messages.length - 1]?.content.slice(0, 50) || "";

      setHistory((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === sessionId);
        const newSession: ChatSession = {
          id: sessionId,
          conversationId,
          title,
          preview,
          date: formatDate(new Date()),
          messages: [...messages],
          isPinned: existingIndex >= 0 ? prev[existingIndex].isPinned : false,
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    }
  }, [messages, conversationId, user, currentSessionId]);

  // --- History Actions ---
  const handlePin = (id: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setActiveMenuId(null);
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setActiveMenuId(null);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === renamingId ? { ...item, title: renameValue } : item
        )
      );
    }
    setRenamingId(null);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setConversationId(session.conversationId);
    setCurrentSessionId(session.id);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // --- Chat Handlers ---
  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return;
    
    const userText = input.trim();
    setInput("");
    setError(null);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);
    setIsLoading(true);

    try {
      const response = await sendMessage(conversationId, userText, user?.id?.toString());
      
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        image_analysis: response.image_analysis,
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again."
      );
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== newUserMsg.id));
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!conversationId || isLoading) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setError(null);
    setIsLoading(true);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `📷 [Image uploaded: ${file.name}]`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const response = await uploadImage(
        conversationId,
        file,
        "Analyze this nail image",
        user?.id?.toString()
      );

      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        image_analysis: response.image_analysis,
      };
      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Failed to upload image:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again."
      );
      setMessages((prev) => prev.filter((m) => m.id !== newUserMsg.id));
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const response = await createConversation(user?.id?.toString());
      setConversationId(response.conversation_id);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      setError("Failed to create new chat. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredHistory = history
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  // --- Helper Functions ---
  function formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // --- Render Components ---

  const ErrorBanner = () => {
    if (!error) return null;
    
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
        <div className="bg-white border-l-4 border-red-500 rounded-xl shadow-xl p-4 max-w-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-[#3D5A6C] mb-1">Error</h4>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const HistoryLoginPrompt = () => {
    if (!showHistoryLoginPrompt) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-[#D98B99]" />
        </div>
        <h3 className="text-xl font-bold text-[#3D5A6C] mb-2">
          Save Your Conversations
        </h3>
        <p className="text-gray-600 mb-6 max-w-xs">
          Log in to access your chat history and continue conversations across devices.
        </p>
        <button
          onClick={() => {
            setShowHistoryLoginPrompt(false);
            setShowLoginModal(true);
          }}
          className="px-6 py-3 bg-[#3D5A6C] text-white font-semibold rounded-xl hover:bg-[#2F4A58] transition-all shadow-sm"
        >
          Log In to Continue
        </button>
      </div>
    );
  };

  const Sidebar = () => (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-[300px]
        bg-[#F9FAFB]/95 backdrop-blur-xl border-r border-gray-200/60
        transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        flex flex-col shadow-2xl md:shadow-lg
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="flex flex-col h-full w-full">
        <div className="p-4 flex flex-col gap-4 shrink-0 pt-6">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#3D5A6C] text-lg pl-1 tracking-tight">
              Chats
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-[#3D5A6C] hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {user ? (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#D98B99] transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-xl py-2 pl-9 pr-3 text-sm text-[#3D5A6C] placeholder-gray-400 focus:ring-2 focus:ring-[#D98B99]/20 focus:bg-white transition-all"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowHistoryLoginPrompt(true)}
              className="w-full flex items-center gap-2 justify-center bg-[#D98B99]/10 text-[#D98B99] py-2 px-4 rounded-xl text-sm font-medium hover:bg-[#D98B99]/20 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Log in for history</span>
            </button>
          )}
        </div>

        <div className="px-4 mb-2 shrink-0">
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="w-full flex items-center gap-3 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#3D5A6C] font-semibold py-3 px-4 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-[#D98B99]">
              <Plus className="w-5 h-5" strokeWidth={3} />
            </div>
            <span>New Chat</span>
          </button>
        </div>

        {user && filteredHistory.length > 0 ? (
          <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2 custom-scrollbar">
            <div className="px-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Recent
            </div>
            {filteredHistory.map((item) => (
              <div key={item.id} className="relative group">
                {renamingId === item.id ? (
                  <div className="p-2 flex items-center gap-2 bg-white rounded-lg border border-[#D98B99]">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 text-sm text-[#3D5A6C] outline-none bg-transparent"
                      onKeyDown={(e) => e.key === "Enter" && saveRename()}
                    />
                    <button
                      onClick={saveRename}
                      className="text-green-500 hover:text-green-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => loadSession(item)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-between border ${
                        currentSessionId === item.id
                          ? "bg-white border-[#D98B99]/30 shadow-sm"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          {item.isPinned && (
                            <Pin className="w-3 h-3 text-[#D98B99] fill-current" />
                          )}
                          <span className="text-sm font-medium text-[#3D5A6C] truncate block">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 truncate block mt-0.5">
                          {item.date}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === item.id ? null : item.id
                        );
                      }}
                      className={`
                        absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 
                        hover:text-[#3D5A6C] hover:bg-gray-200 transition-all 
                        opacity-100 md:opacity-0 md:group-hover:opacity-100 
                        ${
                          activeMenuId === item.id
                            ? "opacity-100 bg-gray-200 text-[#3D5A6C]"
                            : ""
                        }
                      `}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === item.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                      >
                        <div className="py-2 px-2">
                          <button
                            onClick={() => startRename(item.id, item.title)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button
                            onClick={() => handlePin(item.id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Pin className="w-3.5 h-3.5" />{" "}
                            {item.isPinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          user && (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-sm text-gray-400 text-center">
                No chat history yet.<br />Start a conversation!
              </p>
            </div>
          )
        )}

        {!user && showHistoryLoginPrompt && (
          <div className="flex-1 overflow-hidden">
            <HistoryLoginPrompt />
          </div>
        )}
      </div>
    </aside>
  );

  const HeroSection = () => (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center animate-in fade-in duration-700">
      <div className="w-20 h-20 bg-white rounded-3xl shadow-[0_8px_30px_rgba(217,139,153,0.15)] flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-6">
        <Sparkles className="w-10 h-10 text-[#D98B99]" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight mb-4">
        Design your look
      </h1>
      <p className="text-gray-600 text-lg md:text-xl font-light mb-10 max-w-md leading-relaxed">
        Describe an outfit, upload a hand photo, or blend styles to find your
        perfect match.
      </p>

      <div className="flex flex-wrap justify-center gap-3 max-w-2xl w-full">
        {[
          "Create a wedding look 💍",
          "Analyze my hand shape ✋",
          "Match my blue dress 👗",
        ].map((text, i) => (
          <button
            key={i}
            onClick={() => setInput(text)}
            disabled={isLoading}
            className="px-5 py-2.5 bg-white/60 backdrop-blur-sm border border-white/50 text-[#3D5A6C] text-sm font-medium rounded-full hover:bg-white hover:border-[#D98B99]/50 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`flex h-[calc(100vh-64px)] relative font-sans bg-transparent ${
        messages.length === 0 ? "overflow-hidden" : ""
      }`}
    >
      <ErrorBanner />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-[#3D5A6C]/20 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar />

      <main
        className={`flex-1 flex flex-col relative w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          isSidebarOpen ? "md:ml-[300px]" : ""
        }`}
      >
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-20 left-4 z-60 p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-[#3D5A6C] hover:bg-white transition-all hover:scale-105 active:scale-95 animate-in fade-in duration-300"
            title="Open Chats"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center pb-32 md:pb-0">
            <HeroSection />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-40 pt-16 scrollbar-thin scrollbar-thumb-gray-200/50">
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 animate-in slide-in-from-bottom-2 duration-500 fade-in`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm border border-gray-100
                    ${
                      msg.role === "assistant"
                        ? "bg-white text-[#D98B99]"
                        : "bg-white text-gray-600"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">ME</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-sm text-[#3D5A6C]">
                      {msg.role === "assistant" ? "Missland AI" : "You"}
                    </p>
                    <div
                      className={`text-[15px] leading-relaxed text-gray-700 ${
                        msg.role === "user"
                          ? "bg-white/60 p-3 rounded-2xl rounded-tl-none inline-block shadow-sm"
                          : ""
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.image_analysis && (
                      <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-3 mt-2">
                        <p className="text-xs font-semibold text-[#D98B99] mb-1">
                          IMAGE ANALYSIS
                        </p>
                        <p className="text-sm text-gray-600">{msg.image_analysis}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 animate-in fade-in">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5 text-[#D98B99]" />
                  </div>
                  <div className="flex items-center gap-1.5 h-9 pl-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div
          className={`
          fixed right-0 transition-all duration-300 ease-in-out z-20
          ${isSidebarOpen ? "md:left-[300px]" : "left-0"}
          ${
            messages.length > 0
              ? "bottom-[60px] md:bottom-0 bg-linear-to-t from-[#FDF8F9] via-[#FDF8F9]/95 to-transparent pt-10 pb-3 md:pb-8"
              : "bottom-[60px] md:bottom-0 pb-3 md:pb-8 bg-transparent pointer-events-none"
          } 
        `}
        >
          <div className="max-w-2xl mx-auto px-4 md:px-6 w-full relative pointer-events-auto">
            <div className="relative flex items-end gap-2 bg-white p-2 rounded-[26px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 focus-within:border-[#D98B99]/50 focus-within:shadow-[0_8px_30px_rgba(217,139,153,0.1)] transition-all duration-300 group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                    e.target.value = "";
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!conversationId || isLoading}
                className="p-2.5 mb-2 text-gray-400 hover:text-[#3D5A6C] hover:bg-gray-50 rounded-full transition-colors shrink-0 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload Photo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!conversationId || isLoading}
                placeholder={
                  !conversationId
                    ? "Initializing chat..."
                    : isLoading
                    ? "Sending..."
                    : "Ask anything..."
                }
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#3D5A6C] placeholder:text-gray-300 py-3.5 resize-none max-h-[120px] min-h-[52px] text-[16px] leading-relaxed disabled:opacity-50"
                rows={1}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim() || !conversationId || isLoading}
                className={`
                  w-10 h-10 aspect-square rounded-full flex items-center justify-center mb-2 mr-1 transition-all duration-200 shadow-sm shrink-0
                  ${
                    input.trim() && conversationId && !isLoading
                      ? "bg-[#3D5A6C] text-white hover:bg-[#2F4A58] scale-100"
                      : "bg-gray-100 text-gray-300 scale-95 cursor-not-allowed"
                  }
                `}
              >
                <ArrowUp className="w-5 h-5 stroke-[3px]" />
              </button>
            </div>

            <div className="text-center mt-2">
              <p className="text-[10px] text-gray-400 font-medium opacity-60">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

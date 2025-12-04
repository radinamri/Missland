import axios, { AxiosError } from "axios";

// Chat API Base URL - now uses Django gateway for unified auth
// The Django backend proxies requests to the RAG service
const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance for chat API
const chatApi = axios.create({
  baseURL: CHAT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface ConversationResponse {
  conversation_id: string;
}

export interface MessageResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  language: string;
  context_sources: Array<{
    title: string;
    category: string;
    score: number;
  }>;
  image_analyzed: boolean;
  image_analysis?: string;
  tokens_used: number;
  error: string | null;
  explore_link?: string;  // Link to explore page with relevant filters
}

export interface ConversationHistory {
  conversation_id: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    image_analysis?: string;
  }>;
  message_count: number;
}

export interface ChatError {
  detail: string;
}

// API Functions

/**
 * Create a new conversation
 */
export async function createConversation(userId?: string): Promise<ConversationResponse> {
  try {
    const response = await chatApi.post<ConversationResponse>("/api/auth/chat/conversation/", {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      throw new Error(axiosError.response?.data?.detail || "Failed to create conversation");
    }
    throw error;
  }
}

/**
 * Send a text message
 */
export async function sendMessage(
  conversationId: string,
  message: string,
  userId?: string
): Promise<MessageResponse> {
  try {
    const response = await chatApi.post<MessageResponse>("/api/auth/chat/message/", {
      conversation_id: conversationId,
      message,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      throw new Error(axiosError.response?.data?.detail || "Failed to send message");
    }
    throw error;
  }
}

/**
 * Upload an image with optional message
 */
export async function uploadImage(
  conversationId: string,
  imageFile: File,
  message?: string,
  userId?: string
): Promise<MessageResponse> {
  try {
    const formData = new FormData();
    formData.append("conversation_id", conversationId);
    formData.append("image", imageFile);
    if (message) {
      formData.append("message", message);
    }
    if (userId) {
      formData.append("user_id", userId);
    }

    const response = await chatApi.post<MessageResponse>("/api/auth/chat/image/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      throw new Error(axiosError.response?.data?.detail || "Failed to upload image");
    }
    throw error;
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string): Promise<ConversationHistory> {
  try {
    const response = await chatApi.get<ConversationHistory>(
      `/api/auth/chat/conversation/${conversationId}/history/`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      throw new Error(axiosError.response?.data?.detail || "Failed to fetch conversation history");
    }
    throw error;
  }
}

/**
 * Clear conversation
 */
export async function clearConversation(conversationId: string): Promise<void> {
  try {
    await chatApi.delete(`/api/auth/chat/conversation/${conversationId}/`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      throw new Error(axiosError.response?.data?.detail || "Failed to clear conversation");
    }
    throw error;
  }
}

/**
 * Check health of chat service
 */
export async function checkHealth(): Promise<{ status: string; system_ready: boolean }> {
  try {
    const response = await chatApi.get("/api/auth/chat/health/");
    return response.data;
  } catch (error) {
    throw new Error("Chat service is unavailable");
  }
}

// File validation
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

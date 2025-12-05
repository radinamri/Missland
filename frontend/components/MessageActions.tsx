"use client";

import React, { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: "user" | "assistant";
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
}

/**
 * MessageActions - Professional action buttons for chat messages
 * 
 * Implements best practices from major AI chat assistants (ChatGPT, Claude):
 * - Always visible buttons for better discoverability
 * - Assistant messages: Like, Dislike, Copy (all visible)
 * - User messages: Copy only
 * - Like/Dislike are mutually exclusive
 * - Smooth transitions and professional styling
 */
export const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  content,
  role,
  onLike,
  onDislike,
  isLiked = false,
  isDisliked = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [content]);

  const handleLike = useCallback(() => {
    if (onLike) {
      onLike(messageId);
    }
  }, [messageId, onLike]);

  const handleDislike = useCallback(() => {
    if (onDislike) {
      onDislike(messageId);
    }
  }, [messageId, onDislike]);

  // Shared button styles for consistency
  const baseButtonClass = "p-1.5 rounded-lg transition-all duration-150 flex items-center justify-center hover:scale-110 active:scale-95";
  const inactiveButtonClass = "text-gray-400 hover:text-gray-600 hover:bg-gray-100/60";
  const activeButtonClass = "text-[#D98B99]";

  return (
    <div className="flex items-center gap-0.5 mt-3 opacity-100 transition-opacity duration-200">
      {/* Like button - only for assistant messages */}
      {role === "assistant" && (
        <button
          onClick={handleLike}
          className={`${baseButtonClass} ${
            isLiked
              ? `${activeButtonClass} bg-[#D98B99]/10`
              : inactiveButtonClass
          }`}
          title={isLiked ? "Remove like" : "Like this response"}
          aria-label={isLiked ? "Remove like" : "Like this response"}
        >
          <ThumbsUp
            className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
          />
        </button>
      )}

      {/* Dislike button - only for assistant messages */}
      {role === "assistant" && (
        <button
          onClick={handleDislike}
          className={`${baseButtonClass} ${
            isDisliked
              ? "text-gray-600 bg-gray-100/60"
              : inactiveButtonClass
          }`}
          title={isDisliked ? "Remove dislike" : "Dislike this response"}
          aria-label={isDisliked ? "Remove dislike" : "Dislike this response"}
        >
          <ThumbsDown
            className={`w-4 h-4 ${isDisliked ? "fill-current" : ""}`}
          />
        </button>
      )}

      {/* Copy button - for all messages */}
      <button
        onClick={handleCopy}
        className={`${baseButtonClass} ${
          copied
            ? "text-green-500 bg-green-50/60"
            : inactiveButtonClass
        }`}
        title={copied ? "Copied!" : "Copy message"}
        aria-label={copied ? "Copied!" : "Copy message"}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default MessageActions;

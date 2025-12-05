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
 * MessageActions - Action buttons for chat messages
 * - Assistant messages: Like, Dislike, Copy
 * - User messages: Copy only
 * 
 * Like/Dislike are mutually exclusive - activating one deactivates the other
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

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Like button - only for assistant messages */}
      {role === "assistant" && (
        <button
          onClick={handleLike}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isLiked
              ? "text-[#D98B99] bg-[#D98B99]/10"
              : "text-gray-400 hover:text-[#D98B99] hover:bg-gray-100"
          }`}
          title={isLiked ? "Liked" : "Like"}
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
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isDisliked
              ? "text-gray-600 bg-gray-100"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
          title={isDisliked ? "Disliked" : "Dislike"}
        >
          <ThumbsDown
            className={`w-4 h-4 ${isDisliked ? "fill-current" : ""}`}
          />
        </button>
      )}

      {/* Copy button - for all messages */}
      <button
        onClick={handleCopy}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
          copied
            ? "text-green-500 bg-green-50"
            : "text-gray-400 hover:text-[#3D5A6C] hover:bg-gray-100"
        }`}
        title={copied ? "Copied!" : "Copy"}
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

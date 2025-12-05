/**
 * Delete Chat Confirmation Modal
 * 
 * Confirmation dialog for deleting a chat from history.
 * Matches the app's design system with warning styling.
 */

"use client";

import { Trash2, AlertTriangle, X } from "lucide-react";

interface DeleteChatModalProps {
  isOpen: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteChatModal({
  isOpen,
  chatTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteChatModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          {/* Close button */}
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with icon */}
          <div className="flex items-center justify-center pt-6 pb-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <h2 
              id="delete-modal-title"
              className="text-xl font-bold text-[#3D5A6C] text-center mb-2"
            >
              Delete Chat?
            </h2>
            <p className="text-gray-600 text-center text-sm mb-4">
              Are you sure you want to permanently remove this chat from your history?
            </p>

            {/* Chat title preview */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Chat to delete
              </p>
              <p className="text-[#3D5A6C] font-medium truncate">
                {chatTitle || "Untitled Chat"}
              </p>
            </div>

            {/* Warning text */}
            <div className="bg-red-50 rounded-xl p-3 mb-6 border border-red-100">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ This action cannot be undone. The chat and all its messages will be permanently deleted.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-[#3D5A6C] bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Chat
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Chat Login Prompt
 * 
 * Popup shown to guest users after their first message to encourage
 * login/registration for chat history and additional features.
 * 
 * Features:
 * - Non-blocking overlay
 * - Highlights benefits of logging in
 * - Links to login/register
 * - Dismissible
 */

"use client";

import { X, MessageSquare, History, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatLoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatLoginPrompt({ isOpen, onClose }: ChatLoginPromptProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  const handleRegister = () => {
    onClose();
    router.push("/register");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[100] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="pt-8 pb-4 px-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D98B99]/20 to-[#D98B99]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#D98B99]" />
            </div>
            <h2 className="text-xl font-bold text-[#3D5A6C] mb-2">
              Unlock Full Experience
            </h2>
            <p className="text-gray-600 text-sm">
              Create a free account to save your chats and access more features!
            </p>
          </div>

          {/* Benefits */}
          <div className="px-6 pb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <History className="w-5 h-5 text-[#D98B99]" />
                </div>
                <div>
                  <p className="font-semibold text-[#3D5A6C] text-sm">Chat History</p>
                  <p className="text-xs text-gray-500">Save and revisit your conversations</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-5 h-5 text-[#D98B99]" />
                </div>
                <div>
                  <p className="font-semibold text-[#3D5A6C] text-sm">Multiple Chats</p>
                  <p className="text-xs text-gray-500">Start new conversations anytime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={handleRegister}
              className="w-full py-3 bg-[#3D5A6C] text-white font-semibold rounded-xl hover:bg-[#2F4A58] transition-all shadow-sm"
            >
              Create Free Account
            </button>
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-gray-100 text-[#3D5A6C] font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Already have an account? Log in
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

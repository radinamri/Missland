"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/Toast";

interface EditEmailModalProps {
  show: boolean;
  onClose: () => void;
  currentEmail: string;
}

export default function EditEmailModal({
  show,
  onClose,
  currentEmail,
}: EditEmailModalProps) {
  const { initiateEmailChange } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (!show) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newEmail.trim()) {
      setError("Email cannot be empty");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (newEmail.trim() === currentEmail) {
      setError("Please enter a different email address");
      return;
    }

    setIsLoading(true);
    try {
      await initiateEmailChange(newEmail.trim());
      setToastMessage("Email change initiated successfully! ✓");
      setShowToast(true);
      setNewEmail("");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError("Failed to initiate email change. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#3D5A6C]">
            Change Email Address
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Current email: <span className="font-semibold">{currentEmail}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Email Address
            </label>
            <input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter your new email"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D5A6C] focus:border-[#3D5A6C] placeholder:text-gray-400 text-gray-700 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Info Message */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ We&apos;ll send a verification link to your new email address
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-[#3D5A6C] to-[#2E4A5A] text-white font-bold py-3 px-4 rounded-lg hover:from-[#314A5A] hover:to-[#263D4A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Change Email"
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      <Toast
        message={toastMessage}
        show={showToast}
        type="success"
        duration={2000}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

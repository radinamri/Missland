"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteModalProps) {
  const { user, deleteAccount } = useAuth();
  const [password, setPassword] = useState("");

  const handleGoogleConfirm = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Send the new access token to the backend for verification
      deleteAccount({ access_token: tokenResponse.access_token });
    },
    onError: () => {
      alert("Google authentication failed. Please try again.");
    },
  });

  const handlePasswordConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    deleteAccount({ password });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in-down">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h2>
        <p className="text-gray-600 mb-6">
          This action is permanent and cannot be undone. All your data,
          including saved posts and try-ons, will be permanently removed.
        </p>

        {/* Conditionally render the confirmation method */}
        {user?.has_password ? (
          <form onSubmit={handlePasswordConfirm}>
            <p className="text-sm text-gray-700 mb-2">
              To confirm, please enter your password:
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 placeholder:text-gray-400 text-gray-500 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition mb-4"
              placeholder="Your Password"
              required
            />
            <button
              type="submit"
              className="bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition w-full"
            >
              Permanently Delete Account
            </button>
          </form>
        ) : (
          <div>
            <p className="text-sm text-gray-700 mb-4">
              To confirm, please re-authenticate with Google:
            </p>
            <button
              onClick={() => handleGoogleConfirm()}
              className="bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition w-full"
            >
              Confirm with Google & Delete
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

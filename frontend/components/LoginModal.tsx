"use client";

import Link from "next/link";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-fade-in-down">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Log in to Save
        </h2>
        <p className="text-gray-600 mb-6">
          Create an account or log in to save your favorite styles and access
          them anytime.
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            href="/login"
            className="bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 transition w-full"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition w-full"
          >
            Sign Up
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Icon from "@/public/icon"; // Import your brand Icon component

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative animate-fade-in-down">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
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

        <div className="mx-auto mb-4">
          <Icon className="w-16 h-16 mx-auto" />
        </div>

        <h2 className="text-2xl font-bold text-[#3D5A6C] mb-2">
          Join to Continue
        </h2>
        <p className="text-gray-500 mb-6">
          Create an account or log in to save styles and access all features.
        </p>

        <div className="flex flex-col space-y-3">
          <Link
            href="/register"
            className="w-full block bg-[#3D5A6C] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#314A5A] transition"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="w-full block bg-[#E7E7E7] text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-[#dcdcdc] transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

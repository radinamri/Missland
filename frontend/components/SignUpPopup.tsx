"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface SignUpPopupProps {
  show: boolean;
  onClose: () => void;
}

export default function SignUpPopup({ show, onClose }: SignUpPopupProps) {
  const { googleLogin } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      googleLogin(tokenResponse.access_token);
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  if (!show) {
    return null;
  }

  return (
    // On mobile, this is now positioned 20 units from the bottom (the height of the nav bar)
    // On desktop, it reverts to the corner pop-up style.
    <div className="fixed bottom-24 right-4 left-4 md:bottom-6 md:right-6 md:left-auto z-50 md:w-full md:max-w-sm animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
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

        <h3 className="text-xl font-bold text-gray-800 mb-2">
          You are signed out
        </h3>
        <p className="text-gray-600 mb-4">Sign in to get the best experience</p>

        <div className="space-y-2 md:space-y-3">
          <Link
            href="/register"
            className="w-full block bg-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-600 transition"
          >
            Continue with email
          </Link>
          <button
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              ></path>
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.534-11.082-8.294l-6.573,4.817C9.656,39.663,16.318,44,24,44z"
              ></path>
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.904,36.213,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

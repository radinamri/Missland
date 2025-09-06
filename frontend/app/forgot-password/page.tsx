"use client";

import { useState } from "react";
import api from "@/utils/api";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const response = await api.post("/api/auth/password/reset/", { email });
      setMessage(response.data.detail);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // We still show a generic message on error for security
      setMessage(
        "If an account with that email exists, a password reset link has been sent."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500 mt-2">
            Enter your email to receive a reset link.
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : message ? (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
            <p>{message}</p>
            <Link
              href="/login"
              className="font-bold underline mt-2 inline-block"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
            >
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

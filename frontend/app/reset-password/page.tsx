"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/utils/api";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const [uid, setUid] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUid(searchParams.get("uid"));
    setToken(searchParams.get("token"));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    if (!uid || !token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/api/auth/password/reset/confirm/", {
        uid,
        token,
        new_password1: password,
        new_password2: password2,
      });
      setMessage(response.data.detail);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.detail || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Reset Your Password
          </h1>
        </div>

        {message ? (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
            <p>{message}</p>
            <Link
              href="/login"
              className="font-bold underline mt-2 inline-block"
            >
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 text-gray-500"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password2"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="mt-1 w-full px-4 py-2 bg-gray-100 border-transparent rounded-md focus:ring-2 focus:ring-pink-500 text-gray-500"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !uid || !token}
              className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

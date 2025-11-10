"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Redirect to login if not authenticated
      if (!user) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      // Check if user has dashboard access
      const hasDashboardAccess =
        user.is_staff ||
        user.is_superuser ||
        ["ADMIN", "ANNOTATOR", "SUPERUSER"].includes(user.role);

      if (!hasDashboardAccess) {
        // User is authenticated but doesn't have dashboard role
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (
    user &&
    !user.is_staff &&
    !user.is_superuser &&
    !["ADMIN", "ANNOTATOR", "SUPERUSER"].includes(user.role)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            Dashboard access requires ADMIN, ANNOTATOR, or SUPERUSER role.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated and has dashboard access, render the dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Missland Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user.username} ({user.role})
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to App
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => router.push("/dashboard")}
                className="py-4 px-1 border-b-2 border-pink-500 text-pink-600 font-medium text-sm"
              >
                Annotations
              </button>
              {(user.role === "ADMIN" || user.is_superuser) && (
                <button
                  onClick={() => router.push("/dashboard/users")}
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors"
                >
                  User Management
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Fallback: should not reach here, but just in case
  return null;
}

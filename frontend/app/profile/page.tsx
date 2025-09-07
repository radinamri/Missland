"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

// --- Reusable Card component for the dashboard grid ---
const DashboardActionCard = ({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) => (
  <Link
    href={href}
    className="block bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
  >
    <div className="flex items-center space-x-4">
      <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="font-bold text-lg text-[#3D5A6C]">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  </Link>
);

// --- Main Page Component ---
export default function ProfileHomePage() {
  const { user, isLoading, logoutUser } = useAuth();

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  // Quick access links for the dashboard view
  const dashboardLinks = [
    {
      href: "/profile/saved",
      title: "My Collections",
      description: "View and manage your saved posts.",
      icon: (
        <svg
          className="w-6 h-6 text-[#3D5A6C]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          ></path>
        </svg>
      ),
    },
    {
      href: "/profile/my-try-ons",
      title: "My Try-Ons",
      description: "See all the styles you have tried on.",
      icon: (
        <svg
          className="w-6 h-6 text-[#3D5A6C]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
          />
        </svg>
      ),
    },
    {
      href: "/profile/settings",
      title: "Account Settings",
      description: "Update your profile and password.",
      icon: (
        <svg
          className="w-6 h-6 text-[#3D5A6C]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* --- This content is only for mobile screens --- */}
      <div className="lg:hidden space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="w-20 h-20 bg-[#A4BBD0] rounded-full mx-auto flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#3D5A6C] truncate">
            {user.username}
          </h2>
          <p className="text-gray-500 text-sm truncate">{user.email}</p>
        </div>
        <div className="space-y-2">
          {dashboardLinks.map((link) => (
            <DashboardActionCard key={link.href} {...link} />
          ))}
          <div className="pt-2">
            <button
              onClick={logoutUser}
              className="w-full flex items-center text-left p-4 rounded-2xl font-semibold text-red-500 bg-white shadow-sm hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center mr-4">
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
              </div>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* --- This content is only for laptop/desktop screens --- */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-4xl font-bold text-[#3D5A6C] mb-2">
            Welcome, {user.username}!
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Manage your collections, try-ons, and account settings from here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardLinks.map((link) => (
              <DashboardActionCard key={link.href} {...link} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

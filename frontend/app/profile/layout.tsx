"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Image from "next/image";

// --- Reusable Nav Item Component (Slightly restyled for the new design) ---
const DashboardNavItem = ({
  icon,
  title,
  href,
  isActive,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const commonClasses = `flex items-center text-left p-3 rounded-lg transition-colors w-full`;
  // Softer active state for a more minimal look
  const activeClasses = "bg-gray-100 text-[#3D5A6C] font-semibold";
  const inactiveClasses = "text-gray-600 hover:bg-gray-50 hover:text-gray-800";

  const content = (
    <div
      className={`${commonClasses} ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center mr-3">
        {icon}
      </div>
      <span className="flex-grow text-sm">{title}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return (
    <button onClick={onClick} className="w-full">
      {content}
    </button>
  );
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logoutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  const getInitials = (email: string) => email.charAt(0).toUpperCase() || "U";

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-screen bg-gradient-to-r from-pink-50 to-blue-50 -z-10" />
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar for Desktop - Now a floating, sticky card */}
          <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 sticky top-24">
              {/* User Info */}
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="w-20 h-20 bg-[#A4BBD0] rounded-full mx-auto flex items-center justify-center mb-3 relative overflow-hidden">
                  {user.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt={user.username}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {getInitials(user.email)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-[#3D5A6C] truncate">
                  {user.username}
                </h2>
                <p className="text-gray-500 text-sm truncate">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <DashboardNavItem
                  href="/profile/saved"
                  title="My Collections"
                  isActive={pathname.startsWith("/profile/saved")}
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  }
                />
                <DashboardNavItem
                  href="/profile/my-try-ons"
                  title="My Try-Ons"
                  isActive={pathname.startsWith("/profile/my-try-ons")}
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  }
                />
                <DashboardNavItem
                  href="/profile/settings"
                  title="Account Settings"
                  isActive={pathname === "/profile/settings"}
                  icon={
                    <svg
                      className="w-5 h-5"
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
                  }
                />
              </nav>

              <div className="border-t border-gray-100 pt-4">
                <DashboardNavItem
                  title="Logout"
                  onClick={logoutUser}
                  icon={
                    <svg
                      className="w-5 h-5 text-red-500"
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
                  }
                />
              </div>
            </div>
          </aside>

          {/* Main Content Area (renders the page.tsx or child route) */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}

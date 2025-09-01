"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

// Simple SVG Icon components for clarity
const ExploreIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-7 h-7 ${active ? "text-pink-500" : "text-gray-400"}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
  </svg>
);

const TryOnIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-7 h-7 ${active ? "text-pink-500" : "text-gray-400"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    ></path>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    ></path>
  </svg>
);

const ArticlesIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-7 h-7 ${active ? "text-pink-500" : "text-gray-400"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m0 0h2m0 0h2m0 0h2M7 7h2m0 0h2m0 0h2m0 0h2M7 11h2m0 0h2m0 0h2m0 0h2M7 15h2m0 0h2m0 0h2m0 0h2"
    ></path>
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg
    className={`w-7 h-7 ${active ? "text-pink-500" : "text-gray-400"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    ></path>
  </svg>
);

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Explore", icon: ExploreIcon },
    { href: "/try-on", label: "Try On", icon: TryOnIcon },
    { href: "/articles", label: "Articles", icon: ArticlesIcon },
    { href: user ? "/profile" : "/login", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href === "/") {
            isActive = pathname === item.href;
          } else {
            isActive = pathname.startsWith(item.href);
          }
          if (item.label === "Try On" && pathname.startsWith("/share/post")) {
            isActive = true;
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center space-y-1"
            >
              <item.icon active={isActive} />
              <span
                className={`text-xs font-semibold ${
                  isActive ? "text-pink-500" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

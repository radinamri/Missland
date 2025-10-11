"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useNavigationStore } from "@/stores/navigationStore";
import React from "react";

// --- Icon Components ---
const ExploreIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-7 h-7 transition-colors ${
      active ? "text-[#D98B99]" : "text-[#3D5A6C]"
    }`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

const TryOnIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-7 h-7 transition-colors ${
      active ? "text-[#D98B99]" : "text-[#3D5A6C]"
    }`}
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
);

const ArticlesIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-7 h-7 transition-colors ${
      active ? "text-[#D98B99]" : "text-[#3D5A6C]"
    }`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-7 h-7 transition-colors ${
      active ? "text-[#D98B99]" : "text-[#3D5A6C]"
    }`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { stack } = useNavigationStore();

  const navItems = [
    { href: "/", label: "Explore", icon: ExploreIcon },
    { href: "/try-on", label: "Try On", icon: TryOnIcon },
    { href: "/articles", label: "Articles", icon: ArticlesIcon },
    { href: user ? "/profile" : "/login", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href === "/") {
            isActive =
              pathname === item.href ||
              (stack.length > 0 && stack[stack.length - 1].type === "detail");
          } else {
            isActive = pathname.startsWith(item.href);
          }
          if (item.label === "Try On" && pathname.startsWith("/share/post")) {
            isActive = true;
          }

          const IconComponent = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center space-y-1 w-full h-full"
            >
              <IconComponent active={isActive} />
              <span
                className={`text-xs font-semibold transition-colors ${
                  isActive ? "text-[#D98B99]" : "text-[#3D5A6C]"
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

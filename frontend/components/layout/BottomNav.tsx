"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSearchStore } from "@/stores/searchStore";
import React, { useRef } from "react";

// --- Icon Components ---
const ExploreIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 transition-colors ${
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

const AIChatIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-colors ${
      active ? "text-[#D98B99]" : "text-[#3D5A6C]"
    }`}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
  </svg>
);

const TryOnIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 transition-colors ${
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
    className={`w-6 h-6 transition-colors ${
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
    className={`w-6 h-6 transition-colors ${
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
  const setIsRefreshing = useSearchStore((s) => s.setIsRefreshing);
  
  // Double-tap detection for home icon refresh
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleHomeIconDoubleTap = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }

    lastTapRef.current = now;

    // Clear previous timeout
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

    if (tapCountRef.current === 2 && pathname === "/") {
      // Double tap detected on home page - trigger refresh
      e.preventDefault();
      tapCountRef.current = 0;
      try {
        setIsRefreshing(true);
        await new Promise((r) => setTimeout(r, 2000));
        // Note: fetchPosts(true) is called via the refresh mechanism from page.tsx
        // This just triggers the global state which will be read by page.tsx
        setIsRefreshing(false);
      } catch {
        // Refresh failed silently
        setIsRefreshing(false);
      }
    } else {
      // Reset count after delay if not double-tapped
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  const navItems = [
    { href: "/", label: "Explore", icon: ExploreIcon },
    { href: "/chat", label: "AI Chat", icon: AIChatIcon },
    { href: "/try-on", label: "Try On", icon: TryOnIcon },
    { href: "/articles", label: "Articles", icon: ArticlesIcon },
    { href: user ? "/profile" : "/login", label: "Profile", icon: ProfileIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href === "/") {
            // Explore is active when on home page OR when on post detail
            isActive =
              pathname === item.href ||
              (stack.length > 0 && stack[stack.length - 1].type === "detail") ||
              pathname.startsWith("/post/") ||
              pathname.startsWith("/share/post");
          } else if (item.href === "/chat") {
            isActive = pathname === "/chat";
          } else if (item.href === "/try-on") {
            isActive = pathname.startsWith("/try-on");
            // Try On is also active when viewing shared post try-on
            if (pathname.startsWith("/share/post")) {
              isActive = true;
            }
          } else if (item.href === "/articles") {
            isActive = pathname.startsWith("/articles");
          } else if (item.href === "/profile" || item.href === "/login") {
            isActive =
              pathname.startsWith("/profile") ||
              (pathname === "/login" && !user) ||
              (pathname === "/register" && !user);
          }

          const IconComponent = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => item.label === "Explore" && handleHomeIconDoubleTap(e)}
              className="flex flex-col items-center justify-center space-y-1 w-full h-full"
              title={item.label}
            >
              <IconComponent active={isActive} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

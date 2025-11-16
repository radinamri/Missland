"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LandingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Only run on root path
    if (pathname !== "/") return;

    // Check if user has seen landing page
    const hasSeenLanding =
      typeof window !== "undefined" &&
      localStorage.getItem("hasSeenLanding") === "true";

    // If user hasn't seen landing and is not logged in, redirect to /home
    if (!hasSeenLanding && !user) {
      router.push("/home");
    }
  }, [pathname, user, router]);

  return null;
}

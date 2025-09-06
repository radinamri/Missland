"use client";

import { useAuth } from "@/context/AuthContext";
import SplashScreen from "./SplashScreen";
import { useState, useEffect } from "react";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isAuthLoading } = useAuth();

  // State to control the fade-out animation
  const [isFadingOut, setIsFadingOut] = useState(false);
  // State to unmount the splash screen after the animation
  const [isSplashMounted, setIsSplashMounted] = useState(true);

  useEffect(() => {
    if (!isAuthLoading) {
      // When auth is done loading, start the fade-out
      setIsFadingOut(true);

      // Set a timer to remove the splash screen from the DOM after the animation
      const timer = setTimeout(() => {
        setIsSplashMounted(false);
      }, 500); // This duration should match the transition duration in SplashScreen.tsx

      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  return (
    <>
      {isSplashMounted && <SplashScreen isFadingOut={isFadingOut} />}
      {/* The main app content is always rendered underneath */}
      {children}
    </>
  );
}

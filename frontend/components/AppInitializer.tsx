"use client";

import { useAuth } from "@/context/AuthContext";
import { useSearchStore } from "@/stores/searchStore";
import SplashScreen from "./SplashScreen";
import { useState, useEffect, useRef } from "react";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isAuthLoading } = useAuth();
  const { restoreFiltersFromStorage, fetchFilterSuggestions } = useSearchStore();

  // State to control the fade-out animation
  const [isFadingOut, setIsFadingOut] = useState(false);
  // State to unmount the splash screen after the animation
  const [isSplashMounted, setIsSplashMounted] = useState(true);

  // Prevent multiple initializations
  const hasInitialized = useRef(false);

  // Initialize filters and suggestions on app mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      try {
        // Restore filters from localStorage
        restoreFiltersFromStorage();

        // Fetch filter suggestions for search UI
        await fetchFilterSuggestions();
      } catch {
        // Continue anyway - don't break app on initialization errors
      }
    };

    initialize();
  }, [restoreFiltersFromStorage, fetchFilterSuggestions]);

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

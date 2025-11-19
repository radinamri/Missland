"use client";

import { useEffect, useState } from "react";

/**
 * Hook to trigger signup popup at the optimal time
 * Best practice: Show after 3-5 seconds OR on first scroll (whichever comes first)
 * This engages users without being intrusive
 * 
 * @param shouldTrigger - Pass true when user is NOT logged in (e.g., !user)
 */
export const useSignUpPopupTrigger = (shouldTrigger: boolean) => {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    // Only trigger if shouldTrigger is true
    if (!shouldTrigger) {
      return;
    }

    // Check if popup was already shown in this session
    const popupShownKey = "signup-popup-shown-session";
    const wasShownThisSession = sessionStorage.getItem(popupShownKey);

    if (wasShownThisSession) {
      return;
    }

    let scrollListener: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let hasScrolled = false;

    // Trigger on first scroll
    const handleScroll = () => {
      if (!hasScrolled && !hasShownPopup) {
        hasScrolled = true;
        setShouldShowPopup(true);
        setHasShownPopup(true);
        sessionStorage.setItem(popupShownKey, "true");
        
        // Clean up
        if (scrollListener) {
          window.removeEventListener("scroll", scrollListener);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    scrollListener = handleScroll;
    window.addEventListener("scroll", handleScroll, { once: false });

    // Show popup after 3 seconds if user hasn't scrolled yet
    timeoutId = setTimeout(() => {
      if (!hasScrolled && !hasShownPopup) {
        setShouldShowPopup(true);
        setHasShownPopup(true);
        sessionStorage.setItem(popupShownKey, "true");
        
        // Clean up scroll listener
        if (scrollListener) {
          window.removeEventListener("scroll", scrollListener);
        }
      }
    }, 3000); // 3 seconds

    // Cleanup
    return () => {
      if (scrollListener) {
        window.removeEventListener("scroll", scrollListener);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shouldTrigger, hasShownPopup]);

  const closePopup = () => {
    setShouldShowPopup(false);
  };

  return { shouldShowPopup, closePopup };
};

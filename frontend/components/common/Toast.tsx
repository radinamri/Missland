"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  show: boolean;
  onClose?: () => void;
  duration?: number;
  type?: "default" | "success" | "error" | "warning" | "info";
}

export default function Toast({
  message,
  show,
  onClose,
  duration = 4000,
  type = "default",
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setIsVisible(show);
    setProgress(100);

    if (!show) return;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 50);
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(dismissTimer);
    };
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  // Color variants based on type
  const variantStyles = {
    default:
      "bg-gradient-to-r from-[#3D5A6C] to-[#4A6F85] text-white border border-[#3D5A6C]/20",
    success:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400/30",
    error:
      "bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-400/30",
    warning:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400/30",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400/30",
  };

  // Icon variants
  const iconVariants = {
    default: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    success: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m0 0l2 2m-2-2l-2-2m0 0l-2 2m2-2l2 2"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        .toast-enter {
          animation: slideInUp 0.3s ease-out forwards;
        }

        .toast-exit {
          animation: slideOutDown 0.3s ease-in forwards;
        }
      `}</style>

      <div
        className={`fixed z-50 pointer-events-auto ${
          isVisible ? "toast-enter" : "toast-exit"
        }`}
        style={{
          // Mobile: bottom center (above bottom nav)
          // Tablet: bottom right
          // Desktop: top right
          bottom: "auto",
          top: "1rem",
          right: "1rem",
          left: "auto",
        }}
      >
        <div className="flex md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
          {/* Mobile Toast */}
          <div
            className={`w-full rounded-2xl shadow-lg border backdrop-blur-sm overflow-hidden ${variantStyles[type]}`}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0">{iconVariants[type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-5 truncate">
                  {message}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) onClose();
                }}
                className="shrink-0 ml-2 inline-flex text-white hover:opacity-70 transition-opacity"
                aria-label="Close notification"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Progress bar - Mobile */}
            <div className="h-1 bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white/60 transition-all ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tablet & Desktop Toast */}
        <div className="hidden md:flex w-full max-w-md">
          <div
            className={`w-full rounded-xl shadow-2xl border backdrop-blur-sm overflow-hidden ${variantStyles[type]}`}
          >
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="shrink-0">{iconVariants[type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-5">{message}</p>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) onClose();
                }}
                className="shrink-0 ml-3 inline-flex text-white hover:opacity-70 transition-opacity"
                aria-label="Close notification"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Progress bar - Desktop/Tablet */}
            <div className="h-1 bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white/60 transition-all ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

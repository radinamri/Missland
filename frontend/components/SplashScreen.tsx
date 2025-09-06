"use client";

import Icon from "@/public/icon"; // Make sure the path to your Icon component is correct

interface SplashScreenProps {
  isFadingOut: boolean;
}

export default function SplashScreen({ isFadingOut }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FEFBF6] transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-pulse">
        <Icon className="w-24 h-24 md:w-32 md:h-32" />
      </div>
    </div>
  );
}

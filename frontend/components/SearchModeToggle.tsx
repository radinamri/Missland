"use client";

import React from "react";
import { Search, Image as ImageIcon } from "lucide-react";

export type SearchMode = "text" | "image";

interface SearchModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  className?: string;
}

export default function SearchModeToggle({
  mode,
  onChange,
  className = "",
}: SearchModeToggleProps) {
  return (
    <div className={`inline-flex rounded-lg bg-gray-100 p-1 ${className}`}>
      <button
        onClick={() => onChange("text")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
          transition-all duration-200
          ${mode === "text"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
          }
        `}
        aria-label="Text search mode"
      >
        <Search className="w-4 h-4" />
        <span>Text</span>
      </button>
      
      <button
        onClick={() => onChange("image")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
          transition-all duration-200
          ${mode === "image"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
          }
        `}
        aria-label="Image search mode"
      >
        <ImageIcon className="w-4 h-4" />
        <span>Image</span>
      </button>
    </div>
  );
}

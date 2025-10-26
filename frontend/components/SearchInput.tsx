// components/SearchInput.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";
import FilterPanel from "./FilterPanel"; // Import our new FilterPanel

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (query: string) => void;
  placeholder: string;
  showFilterPanelOnFocus?: boolean;
  onClear: () => void;
}

export default function SearchInput({
  value,
  onChange,
  onSearchSubmit,
  placeholder,
  showFilterPanelOnFocus = false,
  onClear,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { addToSearchHistory } = useSearchStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (value.trim()) {
        onSearchSubmit(value);
        addToSearchHistory(value);
      }
      setIsFocused(false);
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {isFocused && showFilterPanelOnFocus && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setIsFocused(false)}
        ></div>
      )}

      <div className={`relative ${isFocused ? "z-40" : ""}`} ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            className="w-full placeholder:text-gray-400 text-[#3D5A6C] bg-white border border-gray-300 rounded-2xl py-2.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-[#D98B99] focus:border-[#D98B99] transition"
          />
          <svg
            className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          {value && (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          )}
        </div>

        {isFocused && showFilterPanelOnFocus && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-4 animate-fade-in-down border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 px-2">
              Filter by Category
            </h3>
            <FilterPanel />
          </div>
        )}
      </div>
    </>
  );
}

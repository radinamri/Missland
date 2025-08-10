"use client";

import { useState, useRef, useEffect } from "react";
import SearchSuggestions from "./SearchSuggestions";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (query: string) => void;
  placeholder: string;
  categories: string[];
  onCategoryClick: (category: string) => void;
}

export default function SearchInput({
  value,
  onChange,
  onSearchSubmit,
  placeholder,
  categories,
  onCategoryClick,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchSubmit(value);
      setIsFocused(false);
    }
    if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  // Effect to close suggestions when clicking outside
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
  }, [searchRef]);

  const handleSuggestionClick = (category: string) => {
    onCategoryClick(category);
    setIsFocused(false); // Close suggestions after click
  };

  return (
    <>
      {/* Background Overlay */}
      {isFocused && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10"
          onClick={() => setIsFocused(false)}
        ></div>
      )}

      <div className={`relative ${isFocused ? "z-20" : ""}`} ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            className="w-full placeholder:text-gray-400 text-gray-800 bg-gray-100 border border-transparent rounded-2xl py-3 pl-12 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          <svg
            className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>

          {/* Close Button */}
          {isFocused && (
            <button
              onClick={() => setIsFocused(false)}
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

        {isFocused && (
          <SearchSuggestions
            categories={categories}
            onCategoryClick={handleSuggestionClick}
          />
        )}
      </div>
    </>
  );
}

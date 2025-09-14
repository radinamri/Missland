"use client";

import { useState, useRef, useEffect } from "react";
import SearchSuggestions from "./SearchSuggestions";
import { useSearch } from "@/context/SearchContext";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (query: string) => void;
  placeholder: string;
  categories?: string[];
  onCategoryClick?: (category: string | null) => void;
  activeCategory?: string | null;
}

export default function SearchInput({
  value,
  onChange,
  onSearchSubmit,
  placeholder,
  categories,
  onCategoryClick,
  activeCategory,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setSearchTerm, setSearchHistory } = useSearch();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSearchSubmit(value);
      // Add to search history (limit to 5 items, avoid duplicates)
      setSearchHistory((prev: string[]) => {
        const newHistory = [
          value.trim(),
          ...prev.filter((item: string) => item !== value.trim()),
        ].slice(0, 5);
        return newHistory;
      });
      setIsFocused(false);
    }
    if (e.key === "Escape") {
      setIsFocused(false);
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
  }, [searchRef]);

  const handleSuggestionClick = (category: string | null) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
    setIsFocused(false);
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    onSearchSubmit(term);
    setIsFocused(false);
  };

  return (
    <>
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
            className="w-full placeholder:text-gray-400 text-[#3D5A6C] bg-white border border-gray-300 rounded-2xl py-3 pl-12 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-[#D98B99] focus:border-[#D98B99] transition"
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

        {isFocused && categories && onCategoryClick && (
          <SearchSuggestions
            categories={categories}
            onCategoryClick={handleSuggestionClick}
            activeCategory={activeCategory ?? null}
            onHistoryClick={handleHistoryClick}
          />
        )}
      </div>
    </>
  );
}

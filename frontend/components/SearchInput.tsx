"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";
import FilterPanel from "./FilterPanel";

// New sub-component for a single suggestion item, styled like Pinterest
const SuggestionItem = ({
  suggestion,
  searchTerm,
  onClick,
}: {
  suggestion: string;
  searchTerm: string;
  onClick: () => void;
}) => {
  const words = searchTerm.toLowerCase().trim().split(" ");
  const lastWord = words[words.length - 1] || "";

  let suggestionText;

  // This logic bolds the part of the suggestion that the user hasn't typed yet.
  if (suggestion.toLowerCase().startsWith(lastWord) && lastWord !== "") {
    const typedPart = suggestion.substring(0, lastWord.length);
    const boldPart = suggestion.substring(lastWord.length);
    const otherWords = words.slice(0, -1).join(" ");
    suggestionText = (
      <>
        {otherWords ? `${otherWords} ` : ""}
        {typedPart}
        <span className="font-semibold">{boldPart}</span>
      </>
    );
  } else {
    // For cross-category suggestions, we show the current term + the new term in bold.
    suggestionText = (
      <>
        {searchTerm} <span className="font-semibold">{suggestion}</span>
      </>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={`Search for: ${suggestionText}`}
    >
      <svg
        className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0"
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
      <span className="text-gray-800">{suggestionText}</span>
    </button>
  );
};

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
  const {
    addToSearchHistory,
    searchSuggestions,
    setSearchTerm,
    filterSuggestions,
  } = useSearchStore();

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

  // This function now correctly builds the search term AND triggers the search
  const handleSuggestionClick = (suggestion: string) => {
    const words = value.trim().split(" ").filter(Boolean);
    const lastWord = words[words.length - 1] || "";

    const allFilters = filterSuggestions
      ? [
          ...filterSuggestions.shapes,
          ...filterSuggestions.patterns,
          ...filterSuggestions.sizes,
          ...filterSuggestions.colors,
        ]
      : [];

    const isLastWordComplete = allFilters.includes(lastWord.toLowerCase());
    let newSearchTerm;

    // Decide whether to replace the last word (autocomplete) or append (cross-category)
    if (!isLastWordComplete && words.length > 0) {
      words[words.length - 1] = suggestion;
      newSearchTerm = words.join(" ");
    } else {
      newSearchTerm = `${value.trim()} ${suggestion}`.trim();
    }

    // Bug Fix: We must call both functions to update the state and trigger the search action.
    setSearchTerm(newSearchTerm);
    onSearchSubmit(newSearchTerm);
    setIsFocused(false); // Hide the panel after selection
  };

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
            autoComplete="off" // Disable browser's default autocomplete
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
            {/* Render the suggestion list UI */}
            {searchSuggestions.length > 0 && (
              <div className="pb-2">
                <ul className="space-y-1">
                  {searchSuggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <SuggestionItem
                        suggestion={suggestion}
                        searchTerm={value}
                        onClick={() => handleSuggestionClick(suggestion)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add a divider if both suggestions and filters are showing */}
            {searchSuggestions.length > 0 && <hr className="my-2" />}

            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-4 px-2">
                Filter by Category
              </h3>
              <FilterPanel />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

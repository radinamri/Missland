"use client";

import { useSearchStore } from "@/stores/searchStore";

interface SearchSuggestionsProps {
  categories: string[];
  onCategoryClick: (category: string | null) => void;
  activeCategory: string | null;
  onHistoryClick: (term: string) => void;
}

export default function SearchSuggestions({
  categories,
  onCategoryClick,
  activeCategory,
  onHistoryClick,
}: SearchSuggestionsProps) {
  const { searchHistory, clearSearchHistory } = useSearchStore();

  return (
    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-6 animate-fade-in-down">
      {searchHistory.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-500">
              Recent Searches
            </h3>
            <button
              onClick={clearSearchHistory}
              className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {searchHistory.map((term) => (
              <button
                key={term}
                onClick={() => onHistoryClick(term)}
                className="py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
              >
                {term}
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="text-sm font-semibold text-gray-500 mb-4">
        Browse by Category
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryClick(null)}
          className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
            activeCategory === null
              ? "bg-[#3D5A6C] text-white"
              : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
          }`}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
              activeCategory === category
                ? "bg-[#3D5A6C] text-white"
                : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

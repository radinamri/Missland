"use client";

interface SearchSuggestionsProps {
  categories: string[];
  onCategoryClick: (category: string | null) => void;
  activeCategory: string | null;
}

export default function SearchSuggestions({
  categories,
  onCategoryClick,
  activeCategory,
}: SearchSuggestionsProps) {
  return (
    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-6 animate-fade-in-down">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">
        Browse by Category
      </h3>
      <div className="flex flex-wrap gap-2">
        {/* "All" button to clear the filter */}
        <button
          onClick={() => onCategoryClick(null)}
          className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
            activeCategory === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
              activeCategory === category
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

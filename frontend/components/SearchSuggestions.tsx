"use client";

interface SearchSuggestionsProps {
  categories: string[];
  onCategoryClick: (category: string) => void;
}

export default function SearchSuggestions({
  categories,
  onCategoryClick,
}: SearchSuggestionsProps) {
  // Use the provided categories, or an empty array as a fallback to prevent crashes.
  const popularCategories = (categories || []).slice(0, );

  return (
    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg p-6 animate-fade-in-down">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">
        Popular on NANA-AI
      </h3>
      <div className="flex flex-wrap gap-3">
        {popularCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className="bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

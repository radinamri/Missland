"use client";

interface CategoryFiltersProps {
  categories: string[];
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategoryFilters({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryFiltersProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
        {/* "All" button to clear the filter */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
            activeCategory === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>

        {/* Dynamically generated category buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex-shrink-0 ${
              activeCategory === category
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {/* Capitalize the first letter for better display */}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useSearchStore } from "@/stores/searchStore";

// A reusable pill button for our filters
const FilterPill = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center ${
      isActive
        ? "bg-[#3D5A6C] text-white"
        : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
    }`}
  >
    {label}
    {isActive && (
      <span className="ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg>
      </span>
    )}
  </button>
);

export default function FilterBar() {
  // Get `searchTerm` from the store
  const { filterSuggestions, filters, setFilter, searchTerm } =
    useSearchStore();

  if (!filterSuggestions) {
    return null; // Don't render if suggestions haven't loaded
  }

  // This new logic checks both the explicitly set `filters` and the `searchTerm`
  // to determine which categories are "active". If a category is active, only the
  // relevant pill is shown.

  // Create a set of words from the search term for efficient lookup.
  const searchTerms = new Set(searchTerm.toLowerCase().split(" "));

  // Helper function to find if a search term matches any suggestion in a category.
  const findActiveTermInCategory = (suggestions: string[]): string | null => {
    for (const suggestion of suggestions) {
      if (searchTerms.has(suggestion.toLowerCase())) {
        return suggestion;
      }
    }
    return null;
  };

  // Determine the single active item for each category, from either filters or search term.
  const activeShape =
    filters.shape || findActiveTermInCategory(filterSuggestions.shapes);
  const activePattern =
    filters.pattern || findActiveTermInCategory(filterSuggestions.patterns);
  const activeSize =
    filters.size || findActiveTermInCategory(filterSuggestions.sizes);

  const suggestionsToShow = [];

  // Handle Shapes: If a shape is active (from filter or search), show only that one. Otherwise, show all.
  if (activeShape) {
    suggestionsToShow.push({ type: "shape" as const, value: activeShape });
  } else {
    suggestionsToShow.push(
      ...filterSuggestions.shapes.map((value) => ({
        type: "shape" as const,
        value,
      }))
    );
  }

  // Handle Patterns: If a pattern is active, show only that one. Otherwise, show all.
  if (activePattern) {
    suggestionsToShow.push({ type: "pattern" as const, value: activePattern });
  } else {
    suggestionsToShow.push(
      ...filterSuggestions.patterns.map((value) => ({
        type: "pattern" as const,
        value,
      }))
    );
  }

  // Handle Sizes: If a size is active, show only that one. Otherwise, show all.
  if (activeSize) {
    suggestionsToShow.push({ type: "size" as const, value: activeSize });
  } else {
    suggestionsToShow.push(
      ...filterSuggestions.sizes.map((value) => ({
        type: "size" as const,
        value,
      }))
    );
  }

  // Exception for Colors: Always show all color options.
  suggestionsToShow.push(
    ...filterSuggestions.colors.map((value) => ({
      type: "color" as const,
      value,
    }))
  );

  // The logic to determine which pills are "active" vs "inactive" needs to be more robust now.
  // A pill is active if its value is in the search term OR it's an explicitly set filter.
  const activePills = suggestionsToShow.filter(
    (pill) =>
      filters[pill.type] === pill.value ||
      searchTerms.has(pill.value.toLowerCase())
  );

  const inactivePills = suggestionsToShow.filter(
    (pill) =>
      !(
        filters[pill.type] === pill.value ||
        searchTerms.has(pill.value.toLowerCase())
      )
  );

  const sortedPills = [...activePills, ...inactivePills];

  // Remove duplicate pills that might appear if a filter is set and also in the search term
  const uniqueSortedPills = sortedPills.filter(
    (pill, index, self) =>
      index ===
      self.findIndex((p) => p.type === pill.type && p.value === pill.value)
  );

  return (
    <div className="w-full bg-white">
      <div className="flex items-center space-x-3 overflow-x-auto px-4 md:px-8 no-scrollbar">
        {uniqueSortedPills.map(({ type, value }) => (
          <FilterPill
            key={`${type}-${value}`}
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            isActive={
              filters[type] === value || searchTerms.has(value.toLowerCase())
            }
            onClick={() => setFilter(type, value)}
          />
        ))}
      </div>
    </div>
  );
}

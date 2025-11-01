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
  const { filterSuggestions, filters, setFilter } = useSearchStore();

  if (!filterSuggestions) {
    return null; // Don't render if suggestions haven't loaded
  }

  // --- HIGHLIGHT: MODIFIED LOGIC TO BUILD THE LIST OF SUGGESTIONS TO DISPLAY ---
  // This new logic ensures that once a filter is selected for Shape, Pattern, or Size,
  // only the selected filter from that category is shown. All color options are always shown.

  const suggestionsToShow = [];

  // Handle Shapes: If a shape is selected, show only that one. Otherwise, show all.
  if (filters.shape) {
    suggestionsToShow.push({ type: "shape" as const, value: filters.shape });
  } else {
    suggestionsToShow.push(
      ...filterSuggestions.shapes.map((value) => ({
        type: "shape" as const,
        value,
      }))
    );
  }

  // Handle Patterns: If a pattern is selected, show only that one. Otherwise, show all.
  if (filters.pattern) {
    suggestionsToShow.push({
      type: "pattern" as const,
      value: filters.pattern,
    });
  } else {
    suggestionsToShow.push(
      ...filterSuggestions.patterns.map((value) => ({
        type: "pattern" as const,
        value,
      }))
    );
  }

  // Handle Sizes: If a size is selected, show only that one. Otherwise, show all.
  if (filters.size) {
    suggestionsToShow.push({ type: "size" as const, value: filters.size });
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
  // --- END OF MODIFIED LOGIC ---

  const activePills = suggestionsToShow.filter(
    (pill) => filters[pill.type] === pill.value
  );
  const inactivePills = suggestionsToShow.filter(
    (pill) => filters[pill.type] !== pill.value
  );
  const sortedPills = [...activePills, ...inactivePills];

  return (
    <div className="w-full bg-white">
      <div className="flex items-center space-x-3 overflow-x-auto px-4 md:px-8 no-scrollbar">
        {sortedPills.map(({ type, value }) => (
          <FilterPill
            key={`${type}-${value}`}
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            isActive={filters[type] === value}
            // The onClick logic is already perfect. The store handles toggling the filter on/off.
            // When the filter is turned off, this component will re-render, and the pill
            // will automatically move back into the `inactivePills` group.
            onClick={() => setFilter(type, value)}
          />
        ))}
      </div>
    </div>
  );
}

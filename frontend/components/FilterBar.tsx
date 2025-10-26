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
    className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
      isActive
        ? "bg-[#3D5A6C] text-white"
        : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
    }`}
  >
    {label}
  </button>
);

export default function FilterBar() {
  const { filterSuggestions, filters, setFilter } = useSearchStore();

  if (!filterSuggestions) {
    return null; // Don't render if suggestions haven't loaded
  }

  // Combine all suggestions into a single array for rendering
  const allSuggestions = [
    ...filterSuggestions.shapes.map((s) => ({ type: "shape", value: s })),
    ...filterSuggestions.patterns.map((p) => ({ type: "pattern", value: p })),
    ...filterSuggestions.sizes.map((s) => ({ type: "size", value: s })),
    ...filterSuggestions.colors.map((c) => ({ type: "color", value: c })),
  ];

  return (
    <div className="w-full bg-white">
      <div className="flex items-center space-x-3 overflow-x-auto px-4 md:px-8 no-scrollbar">
        {allSuggestions.map(({ type, value }) => (
          <FilterPill
            key={`${type}-${value}`}
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            isActive={filters[type as keyof typeof filters] === value}
            onClick={() => setFilter(type as keyof typeof filters, value)}
          />
        ))}
      </div>
    </div>
  );
}

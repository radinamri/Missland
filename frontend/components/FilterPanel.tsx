// components/FilterPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";
import { FiChevronDown } from "react-icons/fi";

const filterOptions = {
  // 1. Shape: The most fundamental choice. Ordered from classic/popular to more dramatic.
  shapes: ["square", "almond", "coffin", "stiletto"],

  // 2. Color: The next most common filter. Ordered by a pseudo-spectral wheel, followed by neutrals.
  colors: [
    "red",
    "pink",
    "orange",
    "yellow",
    "green",
    "turquoise",
    "blue",
    "purple",
    "cream",
    "brown",
    "white",
    "gray",
    "black",
  ],

  // 3. Pattern/Finish: Key stylistic choices. Ordered by popularity and type (patterns vs. finishes).
  patterns: ["french", "ombre", "glossy", "matte", "mixed"],

  // 4. Size: A practical filter. Ordered in natural progression.
  sizes: ["short", "medium", "long"],
};

const colorHexMap: { [key: string]: string } = {
  red: "#f87171",
  pink: "#f9a8d4",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#34d399",
  blue: "#60a5fa",
  purple: "#c084fc",
  brown: "#d2b48c",
  gray: "#9ca3af",
  black: "#1f2937",
  white: "#f1f5f9",
  cream: "#fef3c7",
  turquoise: "#2dd4bf",
};

// A reusable dropdown component for our filters
const FilterDropdown = ({
  name,
  options,
  selectedValue,
  onSelect,
}: {
  name: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string | null) => {
    onSelect(option);
    setIsOpen(false);
  };

  const displayName = selectedValue
    ? selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)
    : `Any ${name}`;
  const isActive = selectedValue !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
          isActive
            ? "bg-[#3D5A6C] text-white"
            : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
        }`}
      >
        <span>{displayName}</span>
        <FiChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl z-10 py-1 border border-gray-200">
          {/* <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSelect(null); // This sends `null` to the onSelect handler
            }}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold"
          >
            Any {name}
          </a> */}
          {options.map((option) => (
            <a
              key={option}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {name === "Color" ? (
                <span className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2 border"
                    style={{ backgroundColor: colorHexMap[option] }}
                  ></span>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
              ) : (
                option.charAt(0).toUpperCase() + option.slice(1)
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useSearchStore();

  return (
    <div className="space-y-4">
      {/* --- HIGHLIGHT: THESE CALLS ARE NOW TYPE-SAFE --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FilterDropdown
          name="Shape"
          options={filterOptions.shapes}
          selectedValue={filters.shape}
          onSelect={(val) => setFilter("shape", val)}
        />
        <FilterDropdown
          name="Color"
          options={filterOptions.colors}
          selectedValue={filters.color}
          onSelect={(val) => setFilter("color", val)}
        />
        <FilterDropdown
          name="Pattern"
          options={filterOptions.patterns}
          selectedValue={filters.pattern}
          onSelect={(val) => setFilter("pattern", val)}
        />
        <FilterDropdown
          name="Size"
          options={filterOptions.sizes}
          selectedValue={filters.size}
          onSelect={(val) => setFilter("size", val)}
        />
      </div>
      <button
        onClick={resetFilters}
        className="w-full text-center text-sm font-semibold text-red-500 hover:text-red-700 transition-colors py-2"
      >
        Reset All Filters
      </button>
    </div>
  );
}

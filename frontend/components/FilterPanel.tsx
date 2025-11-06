"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchStore, initialFilters } from "@/stores/searchStore";
import { FiChevronDown } from "react-icons/fi";

const filterOptions = {
  shapes: ["square", "almond", "coffin", "stiletto"],
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
  patterns: ["french", "ombre", "glossy", "matte", "mixed"],
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

// A custom dropdown component for multi-selecting colors
const MultiSelectColorDropdown = ({
  options,
  selectedColors,
  onToggleColor,
}: {
  options: string[];
  selectedColors: string[];
  onToggleColor: (color: string) => void;
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

  const displayName = (() => {
    if (selectedColors.length === 0) return "Any Color";
    if (selectedColors.length === 1)
      return (
        selectedColors[0].charAt(0).toUpperCase() + selectedColors[0].slice(1)
      );
    return `${selectedColors.length} Colors`;
  })();

  const isActive = selectedColors.length > 0;

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
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl z-10 py-2 px-2 border border-gray-200">
          {options.map((option) => {
            const isSelected = selectedColors.includes(option);
            return (
              <a
                key={option}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleColor(option);
                }}
                className={`flex items-center justify-between px-4 py-2 text-sm rounded-lg ${
                  isSelected
                    ? "bg-[#3D5A6C] font-semibold text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2 border"
                    style={{ backgroundColor: colorHexMap[option] }}
                  ></span>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

// The original single-select dropdown component
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
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl z-10 py-2 px-2 border border-gray-200">
          {options.map((option) => (
            <a
              key={option}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterPanelProps {
  isTemporarilyReset?: boolean;
}

export default function FilterPanel({
  isTemporarilyReset = false,
}: FilterPanelProps) {
  const {
    filters: realFilters,
    setFilter,
    resetFilters,
    searchTerm,
  } = useSearchStore();
  const filters = isTemporarilyReset ? initialFilters : realFilters;
  const displaySearchTerm = isTemporarilyReset ? "" : searchTerm;
  const searchTerms = new Set(displaySearchTerm.toLowerCase().split(" "));

  const findActiveTermInCategory = (options: string[]): string | null => {
    for (const option of options) {
      if (searchTerms.has(option.toLowerCase())) {
        return option;
      }
    }
    return null;
  };

  const selectedShape =
    filters.shape || findActiveTermInCategory(filterOptions.shapes);
  const selectedPattern =
    filters.pattern || findActiveTermInCategory(filterOptions.patterns);
  const selectedSize =
    filters.size || findActiveTermInCategory(filterOptions.sizes);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FilterDropdown
          name="Shape"
          options={filterOptions.shapes}
          selectedValue={selectedShape}
          onSelect={(val) => setFilter("shape", val)}
        />
        <MultiSelectColorDropdown
          options={filterOptions.colors}
          selectedColors={filters.color}
          onToggleColor={(color) => setFilter("color", color)}
        />
        <FilterDropdown
          name="Pattern"
          options={filterOptions.patterns}
          selectedValue={selectedPattern}
          onSelect={(val) => setFilter("pattern", val)}
        />
        <FilterDropdown
          name="Size"
          options={filterOptions.sizes}
          selectedValue={selectedSize}
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

"use client";

import { useSearchStore } from "@/stores/searchStore";
import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

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

const sizeSymbols: { [key: string]: string } = {
  short: "S",
  medium: "M",
  long: "L",
};

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  type: "shape" | "pattern" | "size" | "color";
  value: string;
}

const FilterPill = ({
  label,
  isActive,
  onClick,
  type,
  value,
}: FilterPillProps) => {
  // Determine if label should be hidden on mobile (only hide for colors)
  const shouldHideLabelOnMobile = type === "color";

  // Render image/icon content based on type
  const renderVisual = () => {
    if ((type === "shape" || type === "pattern") && value) {
      return (
        <div className="relative w-10 h-10 overflow-hidden flex-shrink-0 rounded-l-md">
          <Image
            src={`/nail-categories/${value}.png`}
            alt={label}
            width={40}
            height={40}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
          />
        </div>
      );
    }

    if (type === "color" && value) {
      return (
        <div
          className={`w-11 h-full flex-shrink-0 rounded-l-md md:rounded-r-none md:border-r md:border-gray-300 sm:rounded-r-md`}
          style={{ backgroundColor: colorHexMap[value] || "#ccc" }}
        ></div>
      );
    }

    if (type === "size" && value) {
      const sizeSymbol = sizeSymbols[value] || value.toUpperCase()[0];
      return (
        <div className="w-10 h-full flex-shrink-0 rounded-l-md bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-700 border-r border-gray-300">
          {sizeSymbol}
        </div>
      );
    }

    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center overflow-hidden group sm:h-10 h-9 ${
        isActive
          ? "bg-[#3D5A6C] text-white hover:bg-[#2d4654]"
          : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
      }`}
    >
      {renderVisual()}
      <span className={`px-3 ${shouldHideLabelOnMobile ? "hidden sm:inline" : "inline"}`}>
        {label}
      </span>
      {isActive && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="transition-transform hover:scale-110 flex-shrink-0 mr-2"
        >
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg>
      )}
    </button>
  );
};

const ScrollButton = ({
  direction,
  onClick,
  visible,
}: {
  direction: "left" | "right";
  onClick: () => void;
  visible: boolean;
}) => (
  <button
    onClick={onClick}
    className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center transition-opacity duration-300 ${
      direction === "left" ? "left-2" : "right-2"
    } ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
  >
    <svg
      className="w-5 h-5 text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {direction === "left" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 19l-7-7 7-7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 5l7 7-7 7"
        />
      )}
    </svg>
  </button>
);

export default function FilterBar() {
  const { filterSuggestions, filters, setFilter, searchTerm } =
    useSearchStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollRight(
        isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
      );
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener("scroll", checkScrollability);
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScrollability);
        resizeObserver.unobserve(el);
      };
    }
  }, [checkScrollability]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollability();
    }, 100);
    return () => clearTimeout(timer);
  }, [filters, searchTerm, checkScrollability]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === "left" ? -250 : 250;
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!filterSuggestions) {
    return null;
  }

  // Check if there are any active filters
  const hasActiveFilters =
    filters.shape !== null ||
    filters.pattern !== null ||
    filters.size !== null ||
    filters.color.length > 0;

  // If no active filters, hide the FilterBar completely
  if (!hasActiveFilters) {
    return null;
  }

  type PillItem = {
    type: "shape" | "pattern" | "size" | "color";
    value: string;
  };

  const allPills: PillItem[] = [];

  // Logic for single-select categories
  const singleSelectCategories: Array<"shapes" | "patterns" | "sizes"> = [
    "shapes",
    "patterns",
    "sizes",
  ];
  
  singleSelectCategories.forEach((category) => {
    const filterKey = category.slice(0, -1) as "shape" | "pattern" | "size";
    const activeFilter = filters[filterKey];
    
    if (activeFilter) {
      // Show only the active filter for this category
      allPills.push({ type: filterKey, value: activeFilter });
    } else {
      // Show all options for this category
      filterSuggestions[category].forEach((value) => {
        allPills.push({ type: filterKey, value });
      });
    }
  });

  // Always show all color options (multi-select)
  filterSuggestions.colors.forEach((value) => {
    allPills.push({ type: "color" as const, value });
  });

  // Separate active and inactive pills for sorting
  const activePills = allPills.filter(({ type, value }) => {
    if (type === "color") {
      return filters.color.includes(value);
    }
    return filters[type as "shape" | "pattern" | "size"] === value;
  });

  const inactivePills = allPills.filter(({ type, value }) => {
    if (type === "color") {
      return !filters.color.includes(value);
    }
    return filters[type as "shape" | "pattern" | "size"] !== value;
  });

  // Show active pills first, then inactive ones
  const sortedPills = [...activePills, ...inactivePills];

  return (
    <div className="w-full bg-white relative py-3">
      <div
        ref={scrollContainerRef}
        className="flex items-center space-x-3 overflow-x-auto pl-4 md:pl-8 pr-12 md:pr-14 no-scrollbar"
      >
        {sortedPills.map(({ type, value }) => {
          const isActive =
            type === "color"
              ? filters.color.includes(value)
              : filters[type as "shape" | "pattern" | "size"] === value;
          
          return (
            <FilterPill
              key={`${type}-${value}`}
              label={value.charAt(0).toUpperCase() + value.slice(1)}
              isActive={isActive}
              onClick={() => setFilter(type, value)}
              type={type}
              value={value}
            />
          );
        })}
      </div>

      <ScrollButton
        direction="left"
        onClick={() => handleScroll("left")}
        visible={canScrollLeft}
      />
      <ScrollButton
        direction="right"
        onClick={() => handleScroll("right")}
        visible={canScrollRight}
      />
    </div>
  );
}

"use client";

import { useSearchStore } from "@/stores/searchStore";
import { useRef, useState, useEffect, useCallback } from "react";

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

  const suggestionsToShow = [];

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
      suggestionsToShow.push({ type: filterKey, value: activeFilter });
    } else {
      suggestionsToShow.push(
        ...filterSuggestions[category].map((value) => ({
          type: filterKey,
          value,
        }))
      );
    }
  });

  // Always show all color options for multi-selection
  suggestionsToShow.push(
    ...filterSuggestions.colors.map((value) => ({
      type: "color" as const,
      value,
    }))
  );

  const activePills = suggestionsToShow.filter(({ type, value }) => {
    if (type === "color") {
      return filters.color.includes(value);
    }
    return filters[type] === value;
  });

  const inactivePills = suggestionsToShow.filter(({ type, value }) => {
    if (type === "color") {
      return !filters.color.includes(value);
    }
    return filters[type] !== value;
  });

  const sortedPills = [...activePills, ...inactivePills];
  const uniqueSortedPills = sortedPills.filter(
    (pill, index, self) =>
      index ===
      self.findIndex((p) => p.type === pill.type && p.value === pill.value)
  );

  return (
    <div className="w-full bg-white relative">
      <div
        ref={scrollContainerRef}
        className="flex items-center space-x-3 overflow-x-auto pl-4 md:pl-8 pr-12 md:pr-14 no-scrollbar"
      >
        {uniqueSortedPills.map(({ type, value }) => {
          const isActive =
            type === "color"
              ? filters.color.includes(value)
              : filters[type] === value;
          return (
            <FilterPill
              key={`${type}-${value}`}
              label={value.charAt(0).toUpperCase() + value.slice(1)}
              isActive={isActive}
              onClick={() => setFilter(type, value)}
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

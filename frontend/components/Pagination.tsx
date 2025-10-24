// components/Pagination.tsx
"use client";

import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// This is a helper hook to calculate the page numbers to display
const usePagination = ({
  totalPages,
  currentPage,
  siblingCount = 1,
}: {
  totalPages: number;
  currentPage: number;
  siblingCount?: number;
}) => {
  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount + 5; // e.g., 1 ... 4 5 6 ... 10

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  }, [totalPages, currentPage, siblingCount]);

  return paginationRange;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const paginationRange = usePagination({ currentPage, totalPages });

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  return (
    <nav className="flex items-center justify-center space-x-2 my-8">
      <button
        onClick={onPrevious}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>

      {paginationRange.map((pageNumber, index) => {
        if (typeof pageNumber === "string") {
          return (
            <span
              key={`dots-${index}`}
              className="w-10 h-10 flex items-center justify-center text-gray-400"
            >
              ...
            </span>
          );
        }

        const isActive = pageNumber === currentPage;
        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
              isActive
                ? "bg-[#3D5A6C] text-white"
                : "bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc]"
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#E7E7E7] text-[#3D5A6C] hover:bg-[#dcdcdc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default Pagination;

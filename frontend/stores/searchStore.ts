import { create } from "zustand";
import api from "@/utils/api";

// Define the structure for filter suggestions
interface FilterSuggestions {
  shapes: string[];
  patterns: string[];
  sizes: string[];
  colors: string[];
}

interface Filters {
  shape: string | null;
  pattern: string | null;
  size: string | null;
  color: string | null;
}

interface SearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Filters;
  setFilter: (filterName: keyof Filters, value: string | null) => void;
  resetFilters: () => void;
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
  showFilterBar: boolean;
  setShowFilterBar: (show: boolean) => void;
  filterSuggestions: FilterSuggestions | null;
  fetchFilterSuggestions: () => Promise<void>;
}

const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),
  filters: initialFilters,
  setFilter: (filterName, value) => {
    set((state) => {
      const oldFilterValue = state.filters[filterName];
      const isFilterBeingRemoved = oldFilterValue === value;

      // Update the filters object by toggling the selected filter.
      const newFilters = {
        ...state.filters,
        [filterName]: isFilterBeingRemoved ? null : value,
      };

      // Update the search term to reflect the filter change.
      let newSearchTerm = state.searchTerm;
      // This logic ensures the value is not null before processing.
      if (value) {
        if (isFilterBeingRemoved) {
          // If a filter is being removed, remove its value from the search term.
          // We use a regular expression with word boundaries (\b) to avoid removing parts of other words.
          const regex = new RegExp(`\\b${value}\\b`, "ig");
          newSearchTerm = newSearchTerm
            .replace(regex, "")
            .replace(/\s+/g, " ")
            .trim();
        } else {
          // If a filter is being added, append its value to the search term.
          // We also check to prevent adding a duplicate word.
          if (!newSearchTerm.toLowerCase().includes(value.toLowerCase())) {
            newSearchTerm = `${newSearchTerm} ${value}`.trim();
          }
        }
      }

      // Recalculate the visibility of the filter bar based on the new state.
      const isAnyFilterActive = Object.values(newFilters).some(
        (v) => v !== null
      );
      const isSearchTermPresent = newSearchTerm.trim() !== "";
      const showFilterBar = isAnyFilterActive || isSearchTermPresent;

      // Return the complete new state, including the updated search term.
      return {
        filters: newFilters,
        searchTerm: newSearchTerm,
        showFilterBar: showFilterBar,
      };
    });
  },
  resetFilters: () => {
    set((state) => {
      // When resetting filters, we only hide the filter bar if there's no active text search.
      const isSearchTermPresent = state.searchTerm.trim() !== "";
      return {
        filters: initialFilters,
        showFilterBar: isSearchTermPresent,
      };
    });
  },
  searchHistory: [],
  addToSearchHistory: (term) =>
    set((state) => {
      if (!term.trim()) return {};
      const newHistory = [
        term.trim(),
        ...state.searchHistory.filter((item) => item !== term.trim()),
      ].slice(0, 5);
      return { searchHistory: newHistory };
    }),
  clearSearchHistory: () => set({ searchHistory: [] }),
  showFilterBar: false,
  setShowFilterBar: (show) => set({ showFilterBar: show }),
  filterSuggestions: null,
  fetchFilterSuggestions: async () => {
    // Prevent re-fetching if data already exists
    if (get().filterSuggestions) return;
    try {
      const response = await api.get<FilterSuggestions>(
        "/api/auth/posts/filter-suggestions/"
      );
      set({ filterSuggestions: response.data });
    } catch (error) {
      console.error("Failed to fetch filter suggestions:", error);
    }
  },
}));

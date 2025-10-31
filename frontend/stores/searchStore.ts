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
      const newFilters = {
        ...state.filters,
        // If the user clicks the same filter again, it will be deselected (set to null).
        [filterName]: state.filters[filterName] === value ? null : value,
      };

      // Check if any filter is active in the new state.
      const isAnyFilterActive = Object.values(newFilters).some(
        (v) => v !== null
      );

      // The FilterBar should be visible if a filter is active.
      // We also check state.showFilterBar to preserve the visibility
      // in case a text search was performed first.
      return {
        filters: newFilters,
        showFilterBar: isAnyFilterActive || state.showFilterBar,
      };
    });
  },
  resetFilters: () => {
    set((state) => {
      // When resetting filters, we only hide the filter bar if there's no active text search.
      // We check if searchTerm is empty; if it is, the user isn't in a text-search state.
      const isSearchTermEmpty = state.searchTerm.trim() === "";
      return {
        filters: initialFilters,
        showFilterBar: isSearchTermEmpty ? false : state.showFilterBar,
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

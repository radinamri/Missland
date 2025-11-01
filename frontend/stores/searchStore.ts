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
      // Determine the new state of filters by toggling the selected one
      const newFilters = {
        ...state.filters,
        [filterName]: state.filters[filterName] === value ? null : value,
      };

      // Check if any filter is active in the new state.
      const isAnyFilterActive = Object.values(newFilters).some(
        (v) => v !== null
      );

      // Check if there's an active text search term.
      const isSearchTermPresent = state.searchTerm.trim() !== "";

      // The FilterBar should only be visible if a filter is active OR if a search term is present.
      // This ensures that if the user removes the last active filter, the bar will hide
      // (unless they also have a search term entered).
      return {
        filters: newFilters,
        showFilterBar: isAnyFilterActive || isSearchTermPresent,
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

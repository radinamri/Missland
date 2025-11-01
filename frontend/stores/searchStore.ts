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

      const newFilters = {
        ...state.filters,
        [filterName]: isFilterBeingRemoved ? null : value,
      };

      let newSearchTerm = state.searchTerm;
      if (value) {
        if (isFilterBeingRemoved) {
          const regex = new RegExp(`\\b${value}\\b`, "ig");
          newSearchTerm = newSearchTerm
            .replace(regex, "")
            .replace(/\s+/g, " ")
            .trim();
        } else {
          if (!newSearchTerm.toLowerCase().includes(value.toLowerCase())) {
            newSearchTerm = `${newSearchTerm} ${value}`.trim();
          }
        }
      }

      const isAnyFilterActive = Object.values(newFilters).some(
        (v) => v !== null
      );
      const isSearchTermPresent = newSearchTerm.trim() !== "";
      const showFilterBar = isAnyFilterActive || isSearchTermPresent;

      return {
        filters: newFilters,
        searchTerm: newSearchTerm,
        showFilterBar: showFilterBar,
      };
    });
  },
  resetFilters: () => {
    set({
      // Reset the filters object to its initial, empty state.
      filters: initialFilters,
      // Completely clear the search term. This was the missing piece.
      searchTerm: "",
      // Hide the filter bar as there are no active filters or search terms.
      showFilterBar: false,
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

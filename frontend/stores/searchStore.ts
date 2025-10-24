// stores/searchStore.ts

import { create } from "zustand";

// Define the structure for our new filters
interface Filters {
  shape: string | null;
  pattern: string | null;
  size: string | null;
  color: string | null;
}

interface SearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // New filter state
  filters: Filters;
  setFilter: (filterName: keyof Filters, value: string | null) => void;
  resetFilters: () => void;
  // We can keep history
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: null,
};

// We remove the persist middleware for now to avoid conflicts during development
export const useSearchStore = create<SearchState>((set) => ({
  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),

  filters: initialFilters,
  setFilter: (filterName, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [filterName]: value,
      },
    })),
  resetFilters: () => set({ filters: initialFilters, searchTerm: "" }),

  searchHistory: [], // You can add back `persist` later if you wish
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
}));

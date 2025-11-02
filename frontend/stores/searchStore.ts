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
  searchSuggestions: string[];
  generateSearchSuggestions: () => void;
  performTextSearch: (query: string) => void;
}

const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: "",
  // Modify setSearchTerm to trigger suggestion generation
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().generateSearchSuggestions(); // Generate new suggestions whenever the term changes
  },
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

      // Also generate new suggestions when a filter is applied via pill click
      const nextState = {
        filters: newFilters,
        searchTerm: newSearchTerm,
        showFilterBar: showFilterBar,
      };

      // We need to do this in a timeout to let the state update first
      setTimeout(() => get().generateSearchSuggestions(), 0);

      return nextState;
    });
  },
  resetFilters: () => {
    set({
      filters: initialFilters,
      searchTerm: "",
      showFilterBar: false,
      searchSuggestions: [], // Clear suggestions on reset
    });
  },
  // Add the new, dedicated search function
  performTextSearch: (query) => {
    // Add to history first
    if (query.trim()) {
      set((state) => ({
        searchHistory: [
          query.trim(),
          ...state.searchHistory.filter((item) => item !== query.trim()),
        ].slice(0, 5),
      }));
    }

    // Now, set the state for the new search in a single, atomic update
    set({
      searchTerm: query, // Set the new search term
      filters: initialFilters, // Reset all category filters
      showFilterBar: true, // Ensure the filter bar is visible
      searchSuggestions: [], // Clear suggestions after a search is committed
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
  searchSuggestions: [],
  generateSearchSuggestions: () => {
    const { searchTerm, filterSuggestions } = get();
    if (!filterSuggestions) return set({ searchSuggestions: [] });

    const words = searchTerm.toLowerCase().split(" ").filter(Boolean);
    if (words.length === 0) return set({ searchSuggestions: [] });

    const lastWord = words[words.length - 1];
    const allSuggestionsSet = new Set<string>();

    const allFilters = [
      ...filterSuggestions.shapes,
      ...filterSuggestions.patterns,
      ...filterSuggestions.sizes,
      ...filterSuggestions.colors,
    ];

    // Mode 1: Autocomplete the last word if it's incomplete
    const isLastWordComplete = allFilters.includes(lastWord);
    if (!isLastWordComplete) {
      allFilters.forEach((filter) => {
        if (filter.startsWith(lastWord) && !words.includes(filter)) {
          allSuggestionsSet.add(filter);
        }
      });
    }

    // Mode 2: Suggest cross-category filters if the last word is complete
    if (isLastWordComplete) {
      const usedCategories = new Set<string>();
      words.forEach((word) => {
        if (filterSuggestions.shapes.includes(word))
          usedCategories.add("shapes");
        if (filterSuggestions.patterns.includes(word))
          usedCategories.add("patterns");
        if (filterSuggestions.sizes.includes(word)) usedCategories.add("sizes");
        if (filterSuggestions.colors.includes(word))
          usedCategories.add("colors");
      });

      // 1. Shapes (Most fundamental)
      if (!usedCategories.has("shapes"))
        filterSuggestions.shapes.forEach((s) => allSuggestionsSet.add(s));

      // 2. Colors (Next most common)
      if (!usedCategories.has("colors"))
        filterSuggestions.colors.forEach((s) => allSuggestionsSet.add(s));

      // 3. Patterns (Stylistic)
      if (!usedCategories.has("patterns"))
        filterSuggestions.patterns.forEach((s) => allSuggestionsSet.add(s));

      // 4. Sizes (Practical)
      if (!usedCategories.has("sizes"))
        filterSuggestions.sizes.forEach((s) => allSuggestionsSet.add(s));
    }

    // Convert set to array, limit the results, and update the state
    set({ searchSuggestions: Array.from(allSuggestionsSet).slice(0, 10) });
  },
}));

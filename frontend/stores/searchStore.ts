// stores/searchStore.ts

import { create } from "zustand";
import api from "@/utils/api";
import { COLOR_SIMPLIFICATION_MAP } from "@/utils/colorMap";

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

// Levenshtein distance function - calculates the "edit distance" between two strings.
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

interface SearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Filters;
  setFilter: (filterName: keyof Filters, value: string | null) => void;
  resetFilters: () => void;
  searchHistory: string[];
  performTextSearch: (query: string) => void;
  showFilterBar: boolean;
  setShowFilterBar: (show: boolean) => void;
  filterSuggestions: FilterSuggestions | null;
  fetchFilterSuggestions: () => Promise<void>;
  searchSuggestions: string[];
  generateSearchSuggestions: () => void;
  correctionSuggestion: string | null;
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: "",
  correctionSuggestion: null,
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().generateSearchSuggestions();
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
      const nextState = {
        filters: newFilters,
        searchTerm: newSearchTerm,
        showFilterBar: showFilterBar,
      };
      setTimeout(() => get().generateSearchSuggestions(), 0);
      return nextState;
    });
  },
  resetFilters: () => {
    set({
      filters: initialFilters,
      searchTerm: "",
      showFilterBar: false,
      searchSuggestions: [],
      correctionSuggestion: null,
    });
  },
  performTextSearch: (query) => {
    const { filterSuggestions } = get();
    const newFilters = { ...initialFilters };
    const nonFilterQueryParts: string[] = [];
    let primaryFilterTerm: string | null = null;

    if (query.trim()) {
      set((state) => ({
        searchHistory: [
          query.trim(),
          ...state.searchHistory.filter((item) => item !== query.trim()),
        ].slice(0, 5),
      }));
    }

    if (filterSuggestions) {
      const allFilterTerms = new Set([
        ...filterSuggestions.shapes,
        ...filterSuggestions.patterns,
        ...filterSuggestions.sizes,
        ...Object.keys(COLOR_SIMPLIFICATION_MAP),
      ]);
      const words = query.toLowerCase().split(" ").filter(Boolean);

      words.forEach((word) => {
        let bestMatch = word;
        if (!allFilterTerms.has(word)) {
          let minDistance = word.length <= 4 ? 1 : 2;
          for (const filter of allFilterTerms) {
            const distance = levenshteinDistance(word, filter);
            if (distance <= minDistance) {
              minDistance = distance;
              bestMatch = filter;
            }
          }
        }

        const baseColor = COLOR_SIMPLIFICATION_MAP[bestMatch.replace(" ", "_")];
        if (baseColor) {
          newFilters.color = baseColor;
          primaryFilterTerm = baseColor;
        } else if (filterSuggestions.shapes.includes(bestMatch)) {
          newFilters.shape = bestMatch;
          primaryFilterTerm = bestMatch;
        } else if (filterSuggestions.patterns.includes(bestMatch)) {
          newFilters.pattern = bestMatch;
          primaryFilterTerm = bestMatch;
        } else if (filterSuggestions.sizes.includes(bestMatch)) {
          newFilters.size = bestMatch;
          primaryFilterTerm = bestMatch;
        } else {
          nonFilterQueryParts.push(bestMatch);
        }
      });
    } else {
      nonFilterQueryParts.push(...query.split(" "));
    }

    let finalSearchTerm = nonFilterQueryParts.join(" ");

    if (
      finalSearchTerm === "" &&
      primaryFilterTerm &&
      query.toLowerCase().split(" ").filter(Boolean).length === 1
    ) {
      finalSearchTerm = primaryFilterTerm;
    }

    set({
      searchTerm: finalSearchTerm,
      filters: newFilters,
      showFilterBar: true,
      searchSuggestions: [],
      correctionSuggestion: null,
    });
  },
  searchHistory: [],
  addToSearchHistory: () => {},
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
    set({ correctionSuggestion: null, searchSuggestions: [] });
    const { searchTerm, filterSuggestions } = get();
    if (!filterSuggestions || !searchTerm.trim()) return;

    const words = searchTerm.toLowerCase().split(" ").filter(Boolean);
    const lastWord = words[words.length - 1];
    const allFilters = [
      ...filterSuggestions.shapes,
      ...filterSuggestions.patterns,
      ...filterSuggestions.sizes,
      ...filterSuggestions.colors,
    ];
    const isLastWordComplete = allFilters.includes(lastWord);

    if (!isLastWordComplete) {
      let bestMatch: string | null = null;
      let minDistance = lastWord.length <= 4 ? 1 : 2;
      for (const filter of allFilters) {
        const distance = levenshteinDistance(lastWord, filter);
        if (distance > 0 && distance <= minDistance) {
          minDistance = distance;
          bestMatch = filter;
        }
      }
      if (bestMatch) {
        set({ correctionSuggestion: bestMatch });
      }
    }

    const suggestionsSet = new Set<string>();
    if (!isLastWordComplete) {
      allFilters.forEach((filter) => {
        if (filter.startsWith(lastWord) && !words.includes(filter)) {
          suggestionsSet.add(filter);
        }
      });
    } else {
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
      if (!usedCategories.has("shapes"))
        filterSuggestions.shapes.forEach((s) => suggestionsSet.add(s));
      if (!usedCategories.has("colors"))
        filterSuggestions.colors.forEach((s) => suggestionsSet.add(s));
      if (!usedCategories.has("patterns"))
        filterSuggestions.patterns.forEach((s) => suggestionsSet.add(s));
      if (!usedCategories.has("sizes"))
        filterSuggestions.sizes.forEach((s) => suggestionsSet.add(s));
    }

    set({ searchSuggestions: Array.from(suggestionsSet).slice(0, 10) });
  },
}));

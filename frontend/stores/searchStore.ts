import { create } from "zustand";
import api from "@/utils/api";
import { COLOR_SIMPLIFICATION_MAP } from "@/utils/colorMap";
import {
  SHAPE_NORMALIZATION_MAP,
  PATTERN_NORMALIZATION_MAP,
  SIZE_NORMALIZATION_MAP,
} from "@/utils/keywordMaps";

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
  color: string[];
}

// Levenshtein distance function
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
  setFilter: (filterName: keyof Filters, value: string) => void;
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
  // Global refresh state for UI (pull-to-refresh)
  isRefreshing: boolean;
  setIsRefreshing: (v: boolean) => void;
}

export const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: [],
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: "",
  correctionSuggestion: null,
  filters: initialFilters,

  // `setSearchTerm` is the single source of truth. It derives the filter state from the search string.
  setSearchTerm: (term) => {
    const { filterSuggestions } = get();
    const newFilters = { ...initialFilters, color: [] as string[] };

    if (filterSuggestions) {
      const words = term.toLowerCase().split(" ").filter(Boolean);
      words.forEach((word) => {
        const canonicalShape = SHAPE_NORMALIZATION_MAP[word];
        const canonicalPattern = PATTERN_NORMALIZATION_MAP[word];
        const canonicalSize = SIZE_NORMALIZATION_MAP[word];
        const baseColor = COLOR_SIMPLIFICATION_MAP[word.replace(" ", "_")];

        if (baseColor && !newFilters.color.includes(baseColor)) {
          newFilters.color.push(baseColor);
        } else if (canonicalShape) {
          newFilters.shape = canonicalShape;
        } else if (canonicalPattern) {
          newFilters.pattern = canonicalPattern;
        } else if (canonicalSize) {
          newFilters.size = canonicalSize;
        }
      });
    }

    set({
      searchTerm: term,
      filters: newFilters,
      showFilterBar:
        term.trim() !== "" ||
        Object.values(newFilters).some((v) =>
          Array.isArray(v) ? v.length > 0 : v !== null
        ),
    });

    get().generateSearchSuggestions();
  },

  // `setFilter` is now a helper function that reconstructs the search term string and calls setSearchTerm.
  setFilter: (filterName, value) => {
    const state = get();
    let words = state.searchTerm.toLowerCase().split(" ").filter(Boolean);
    const filterValue = value; // `value` is guaranteed to be a string here.

    // Check if this filter is currently active BEFORE modifying words
    const isCurrentlyActive = 
      filterName === "color" 
        ? state.filters.color.includes(filterValue)
        : state.filters[filterName] === filterValue;

    // Remove old value for single-select filters
    if (filterName !== "color" && state.filters[filterName]) {
      words = words.filter(
        (w) => w !== state.filters[filterName as "shape" | "pattern" | "size"]
      );
    }

    // Toggle the filter: remove if active, add if inactive
    if (isCurrentlyActive) {
      // Remove it
      words = words.filter((w) => w !== filterValue);
    } else {
      // Add it (only if not already there)
      if (!words.includes(filterValue)) {
        words.push(filterValue);
      }
    }

    const newSearchTerm = [...new Set(words)].join(" ");
    get().setSearchTerm(newSearchTerm);
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

  // `performTextSearch` handles "submit" actions: correcting typos and then calling setSearchTerm.
  performTextSearch: (query) => {
    const { filterSuggestions } = get();
    let correctedQuery = query;

    if (filterSuggestions) {
      const allFilterTerms = new Set([
        ...Object.keys(SHAPE_NORMALIZATION_MAP),
        ...Object.keys(PATTERN_NORMALIZATION_MAP),
        ...Object.keys(SIZE_NORMALIZATION_MAP),
        ...Object.keys(COLOR_SIMPLIFICATION_MAP),
      ]);
      const words = query.toLowerCase().split(" ").filter(Boolean);
      const correctedWords = words.map((word) => {
        if (allFilterTerms.has(word)) return word;
        let bestMatch = word;
        let minDistance = word.length <= 4 ? 1 : 2;
        for (const filter of allFilterTerms) {
          const distance = levenshteinDistance(word, filter);
          if (distance <= minDistance) {
            minDistance = distance;
            bestMatch = filter;
          }
        }
        return bestMatch;
      });
      correctedQuery = correctedWords.join(" ");
    }

    get().setSearchTerm(correctedQuery);

    set((state) => ({
      searchHistory: [
        correctedQuery.trim(),
        ...state.searchHistory.filter((item) => item !== correctedQuery.trim()),
      ].slice(0, 5),
      searchSuggestions: [],
      correctionSuggestion: null,
    }));
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

    const allVariants = [
      ...Object.keys(SHAPE_NORMALIZATION_MAP),
      ...Object.keys(PATTERN_NORMALIZATION_MAP),
      ...Object.keys(SIZE_NORMALIZATION_MAP),
      ...Object.keys(COLOR_SIMPLIFICATION_MAP),
    ];

    const isLastWordComplete = allVariants.includes(lastWord);

    if (!isLastWordComplete) {
      let bestMatch: string | null = null;
      let minDistance = lastWord.length <= 4 ? 1 : 2;
      for (const variant of allVariants) {
        const distance = levenshteinDistance(lastWord, variant);
        if (distance > 0 && distance <= minDistance) {
          minDistance = distance;
          bestMatch = variant;
        }
      }
      if (bestMatch) {
        set({ correctionSuggestion: bestMatch });
      }
    }

    const suggestionsSet = new Set<string>();
    if (!isLastWordComplete) {
      allVariants.forEach((variant) => {
        if (variant.startsWith(lastWord) && !words.includes(variant)) {
          suggestionsSet.add(variant);
        }
      });
    } else {
      const usedCategories = new Set<string>();
      words.forEach((word) => {
        if (SHAPE_NORMALIZATION_MAP[word]) usedCategories.add("shapes");
        if (PATTERN_NORMALIZATION_MAP[word]) usedCategories.add("patterns");
        if (SIZE_NORMALIZATION_MAP[word]) usedCategories.add("sizes");
        if (COLOR_SIMPLIFICATION_MAP[word]) usedCategories.add("colors");
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
  // Global refresh state so UI (header/page) can react
  isRefreshing: false,
  setIsRefreshing: (v: boolean) => set({ isRefreshing: v }),
}));

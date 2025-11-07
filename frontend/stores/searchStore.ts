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

export const initialFilters: Filters = {
  shape: null,
  pattern: null,
  size: null,
  color: [],
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
      const newFilters = { ...state.filters };
      let newSearchTerm = state.searchTerm;

      // Handle multi-select Color
      if (filterName === "color") {
        if (value) {
          const currentColors = state.filters.color;
          const isPresent = currentColors.includes(value);
          if (isPresent) {
            newFilters.color = currentColors.filter((c) => c !== value);
            // Remove color from search term
            const regex = new RegExp(`\\b${value}\\b`, "ig");
            newSearchTerm = newSearchTerm
              .replace(regex, "")
              .replace(/\s+/g, " ")
              .trim();
          } else {
            newFilters.color = [...currentColors, value];
            // Add color to search term
            if (!newSearchTerm.toLowerCase().includes(value.toLowerCase())) {
              newSearchTerm = `${newSearchTerm} ${value}`.trim();
            }
          }
        }
      }
      // Handle single-select Shape, Pattern, Size
      else {
        const filterKey = filterName as "shape" | "pattern" | "size";
        const currentFilterValue = state.filters[filterKey];

        // If there was an old value for this category, remove it from the search term first.
        if (currentFilterValue) {
          const regex = new RegExp(`\\b${currentFilterValue}\\b`, "ig");
          newSearchTerm = newSearchTerm
            .replace(regex, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        // If the user clicks the same filter again, it deselects it.
        if (currentFilterValue === value) {
          newFilters[filterKey] = null;
        }
        // Otherwise, a new filter is being set.
        else if (value) {
          newFilters[filterKey] = value;
          // Add the new value to the search term.
          if (!newSearchTerm.toLowerCase().includes(value.toLowerCase())) {
            newSearchTerm = `${newSearchTerm} ${value}`.trim();
          }
        }
      }

      const isAnyFilterActive = Object.values(newFilters).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== null
      );
      const showFilterBar = isAnyFilterActive || newSearchTerm.trim() !== "";

      setTimeout(() => get().generateSearchSuggestions(), 0);

      return {
        filters: newFilters,
        searchTerm: newSearchTerm,
        showFilterBar,
      };
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
    const { filterSuggestions, filters: currentFilters } = get();
    const newFilters = { ...currentFilters };
    const nonFilterQueryParts: string[] = [];
    const extractedCanonicalTerms: string[] = [];

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
        ...Object.keys(SHAPE_NORMALIZATION_MAP),
        ...Object.keys(PATTERN_NORMALIZATION_MAP),
        ...Object.keys(SIZE_NORMALIZATION_MAP),
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

        const canonicalShape = SHAPE_NORMALIZATION_MAP[bestMatch];
        const canonicalPattern = PATTERN_NORMALIZATION_MAP[bestMatch];
        const canonicalSize = SIZE_NORMALIZATION_MAP[bestMatch];
        const baseColor = COLOR_SIMPLIFICATION_MAP[bestMatch.replace(" ", "_")];

        if (baseColor) {
          if (!newFilters.color.includes(baseColor)) {
            newFilters.color.push(baseColor);
          }
          extractedCanonicalTerms.push(baseColor);
        } else if (canonicalShape) {
          newFilters.shape = canonicalShape;
          extractedCanonicalTerms.push(canonicalShape);
        } else if (canonicalPattern) {
          newFilters.pattern = canonicalPattern;
          extractedCanonicalTerms.push(canonicalPattern);
        } else if (canonicalSize) {
          newFilters.size = canonicalSize;
          extractedCanonicalTerms.push(canonicalSize);
        } else {
          nonFilterQueryParts.push(bestMatch);
        }
      });
    } else {
      nonFilterQueryParts.push(...query.split(" "));
    }

    let finalSearchTerm = nonFilterQueryParts.join(" ");
    if (finalSearchTerm === "" && extractedCanonicalTerms.length > 0) {
      finalSearchTerm = extractedCanonicalTerms.join(" ");
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
}));

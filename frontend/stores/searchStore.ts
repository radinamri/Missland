import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allCategories: string[];
  setAllCategories: (categories: string[]) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  searchHistory: string[];
  addToSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      searchTerm: "",
      setSearchTerm: (term) => set({ searchTerm: term }),
      allCategories: [],
      setAllCategories: (categories) => set({ allCategories: categories }),
      activeCategory: null,
      setActiveCategory: (category) => set({ activeCategory: category }),
      searchHistory: [],
      addToSearchHistory: (term) =>
        set((state) => {
          const newHistory = [
            term.trim(),
            ...state.searchHistory.filter((item) => item !== term.trim()),
          ].slice(0, 5);
          return { searchHistory: newHistory };
        }),
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    { name: "search-storage" } // Persists to localStorage
  )
);

import { create } from "zustand";
import { Post } from "@/types";

interface ExploreState {
  posts: Post[];
  scrollPosition: number;
  pageNumber: number;
  hasMore: boolean;
  searchTerm: string;
  filters: {
    shape?: string;
    pattern?: string;
    size?: string;
    color: string[];
  };
  setPosts: (posts: Post[]) => void;
  setScrollPosition: (position: number) => void;
  setPageNumber: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setSearchFilters: (searchTerm: string, filters: any) => void;
  saveState: (
    posts: Post[],
    scrollPosition: number,
    pageNumber: number,
    hasMore: boolean,
    searchTerm: string,
    filters: any
  ) => void;
  clearState: () => void;
  isStateValid: (searchTerm: string, filters: any) => boolean;
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  posts: [],
  scrollPosition: 0,
  pageNumber: 1,
  hasMore: true,
  searchTerm: "",
  filters: {
    shape: undefined,
    pattern: undefined,
    size: undefined,
    color: [],
  },
  setPosts: (posts) => set({ posts }),
  setScrollPosition: (position) => set({ scrollPosition: position }),
  setPageNumber: (page) => set({ pageNumber: page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setSearchFilters: (searchTerm, filters) =>
    set({ searchTerm, filters }),
  saveState: (posts, scrollPosition, pageNumber, hasMore, searchTerm, filters) =>
    set({ posts, scrollPosition, pageNumber, hasMore, searchTerm, filters }),
  clearState: () =>
    set({
      posts: [],
      scrollPosition: 0,
      pageNumber: 1,
      hasMore: true,
      searchTerm: "",
      filters: {
        shape: undefined,
        pattern: undefined,
        size: undefined,
        color: [],
      },
    }),
  isStateValid: (searchTerm, filters) => {
    const state = get();
    const isValid =
      state.searchTerm === searchTerm &&
      state.filters.shape === filters.shape &&
      state.filters.pattern === filters.pattern &&
      state.filters.size === filters.size &&
      JSON.stringify(state.filters.color.sort()) ===
        JSON.stringify(filters.color.sort());
    
    console.log("[exploreStore] isStateValid check:", {
      cached: {
        searchTerm: state.searchTerm,
        filters: state.filters,
      },
      current: {
        searchTerm,
        filters,
      },
      isValid,
    });
    
    return isValid;
  },
}));

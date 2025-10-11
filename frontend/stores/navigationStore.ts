import { create } from "zustand";
import { Post, NavigationState, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";

interface NavigationStateStore {
  stack: NavigationState[];
  setStack: (
    stack: NavigationState[] | ((prev: NavigationState[]) => NavigationState[])
  ) => void;
  initializeFeed: (initialState: NavigationState) => void;
  handlePostClick: (post: Post) => Promise<void>;
  handleGoBack: () => void;
}

export const useNavigationStore = create<NavigationStateStore>((set) => ({
  stack: [],
  setStack: (stackOrUpdater) => {
    set((state) => {
      if (typeof stackOrUpdater === "function") {
        return { stack: stackOrUpdater(state.stack) };
      }
      return { stack: stackOrUpdater };
    });
  },
  initializeFeed: (initialState) => set({ stack: [initialState] }),
  handlePostClick: async (post) => {
    try {
      const response = await api.get<PaginatedPostResponse>(
        `/api/auth/posts/${post.id}/more/`
      );
      const newView: NavigationState = {
        type: "detail",
        parentPost: post,
        posts: response.data.results,
        seed: String(response.data.seed ?? ""),
      };
      set((state) => ({ stack: [...state.stack, newView] }));
      window.history.pushState({}, "", `/post/${post.id}`);
    } catch (error) {
      console.error("Failed to fetch more posts:", error);
    }
  },
  handleGoBack: () => {
    set((state) => {
      if (state.stack.length <= 1) {
        // Reset to Explore view
        window.history.pushState({}, "", "/");
        return {
          stack: [
            {
              type: "explore" as const,
              posts: [],
              seed: "",
            },
          ],
        };
      }
      window.history.back();
      return { stack: state.stack.slice(0, -1) };
    });
  },
}));

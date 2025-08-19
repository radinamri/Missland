"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { Post, NavigationState, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";

interface NavigationContextType {
  stack: NavigationState[];
  currentView: NavigationState | null;
  handlePostClick: (post: Post) => Promise<void>;
  handleGoBack: () => void;
  initializeFeed: (initialState: NavigationState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [stack, setStack] = useState<NavigationState[]>([]);

  const currentView = stack.length > 0 ? stack[stack.length - 1] : null;

  const initializeFeed = (initialState: NavigationState) => {
    setStack([initialState]);
  };

  const handlePostClick = async (post: Post) => {
    try {
      // Fetch "more posts" for the post that was just clicked
      const response = await api.get<PaginatedPostResponse>(
        `/api/auth/posts/${post.id}/more/`
      );

      const newView: NavigationState = {
        type: "detail",
        parentPost: post,
        posts: response.data.results,
        seed: response.data.seed,
      };

      // Push the new view onto the stack
      setStack((prevStack) => [...prevStack, newView]);
    } catch (error) {
      console.error("Failed to fetch more posts:", error);
    }
  };

  const handleGoBack = () => {
    // Pop the last view from the stack, but never empty it completely
    if (stack.length > 1) {
      setStack((prevStack) => prevStack.slice(0, -1));
    }
  };

  const contextValue: NavigationContextType = {
    stack,
    currentView,
    handlePostClick,
    handleGoBack,
    initializeFeed,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

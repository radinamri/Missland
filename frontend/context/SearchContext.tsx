"use client";

import { createContext, useState, ReactNode, useContext } from "react";

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allCategories: string[];
  setAllCategories: (categories: string[]) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        allCategories,
        setAllCategories,
        activeCategory,
        setActiveCategory,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

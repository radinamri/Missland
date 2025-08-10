"use client";

import { createContext, useState, ReactNode, useContext } from "react";

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allCategories: string[];
  setAllCategories: (categories: string[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([]);

  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, allCategories, setAllCategories }}
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

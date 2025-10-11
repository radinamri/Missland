// "use client";

// import {
//   createContext,
//   useState,
//   ReactNode,
//   useContext,
//   useEffect,
//   SetStateAction,
//   Dispatch,
// } from "react";

// interface SearchContextType {
//   searchTerm: string;
//   setSearchTerm: Dispatch<SetStateAction<string>>;
//   allCategories: string[];
//   setAllCategories: Dispatch<SetStateAction<string[]>>;
//   activeCategory: string | null;
//   setActiveCategory: Dispatch<SetStateAction<string | null>>;
//   searchHistory: string[];
//   setSearchHistory: Dispatch<SetStateAction<string[]>>;
//   clearSearchHistory: () => void;
// }

// const SearchContext = createContext<SearchContextType | undefined>(undefined);

// export const SearchProvider = ({ children }: { children: ReactNode }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [allCategories, setAllCategories] = useState<string[]>([]);
//   const [activeCategory, setActiveCategory] = useState<string | null>(null);
//   const [searchHistory, setSearchHistory] = useState<string[]>([]);

//   // Load search history from local storage on mount
//   useEffect(() => {
//     const storedHistory = localStorage.getItem("searchHistory");
//     if (storedHistory) {
//       setSearchHistory(JSON.parse(storedHistory));
//     }
//   }, []);

//   // Save search history to local storage whenever it changes
//   useEffect(() => {
//     localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
//   }, [searchHistory]);

//   const clearSearchHistory = () => {
//     setSearchHistory([]);
//     localStorage.removeItem("searchHistory");
//   };

//   return (
//     <SearchContext.Provider
//       value={{
//         searchTerm,
//         setSearchTerm,
//         allCategories,
//         setAllCategories,
//         activeCategory,
//         setActiveCategory,
//         searchHistory,
//         setSearchHistory,
//         clearSearchHistory,
//       }}
//     >
//       {children}
//     </SearchContext.Provider>
//   );
// };

// export const useSearch = () => {
//   const context = useContext(SearchContext);
//   if (context === undefined) {
//     throw new Error("useSearch must be used within a SearchProvider");
//   }
//   return context;
// };

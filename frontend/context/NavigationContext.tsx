// "use client";

// import {
//   createContext,
//   useState,
//   useContext,
//   ReactNode,
//   useRef,
//   useEffect,
//   useCallback,
// } from "react";
// import { Post, NavigationState, PaginatedPostResponse } from "@/types";
// import api from "@/utils/api";

// interface NavigationContextType {
//   stack: NavigationState[];
//   currentView: NavigationState | null;
//   handlePostClick: (post: Post) => Promise<void>;
//   handleGoBack: () => void;
//   initializeFeed: (initialState: NavigationState) => void;
//   setStack: (stack: NavigationState[]) => void;
// }

// const NavigationContext = createContext<NavigationContextType | undefined>(
//   undefined
// );

// export const NavigationProvider = ({ children }: { children: ReactNode }) => {
//   const [stack, setStack] = useState<NavigationState[]>([]);
//   const ignorePopRef = useRef(false);

//   const currentView = stack.length > 0 ? stack[stack.length - 1] : null;

//   const initializeFeed = (initialState: NavigationState) => {
//     setStack([initialState]);
//   };

//   const handlePostClick = async (post: Post) => {
//     try {
//       const response = await api.get<PaginatedPostResponse>(
//         `/api/auth/posts/${post.id}/more/`
//       );

//       const newView: NavigationState = {
//         type: "detail",
//         parentPost: post,
//         posts: response.data.results,
//         seed: String(response.data.seed ?? ""),
//       };

//       setStack((prevStack) => [...prevStack, newView]);
//       window.history.pushState({}, "", `/post/${post.id}`);
//     } catch (error) {
//       console.error("Failed to fetch more posts:", error);
//     }
//   };

//   const handleGoBack = useCallback(() => {
//     setStack((prevStack) => {
//       if (prevStack.length <= 1) {
//         return prevStack;
//       }
//       ignorePopRef.current = true;
//       window.history.back();
//       return prevStack.slice(0, -1);
//     });
//   }, []);

//   useEffect(() => {
//     const handlePopState = () => {
//       if (ignorePopRef.current) {
//         ignorePopRef.current = false;
//         return;
//       }
//       setStack((prevStack) => {
//         if (prevStack.length <= 1) {
//           return prevStack;
//         }
//         return prevStack.slice(0, -1);
//       });
//     };

//     window.addEventListener("popstate", handlePopState);
//     return () => window.removeEventListener("popstate", handlePopState);
//   }, []);

//   useEffect(() => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, [stack]);

//   const contextValue: NavigationContextType = {
//     stack,
//     currentView,
//     handlePostClick,
//     handleGoBack,
//     initializeFeed,
//     setStack,
//   };

//   return (
//     <NavigationContext.Provider value={contextValue}>
//       {children}
//     </NavigationContext.Provider>
//   );
// };

// export const useNavigation = () => {
//   const context = useContext(NavigationContext);
//   if (!context) {
//     throw new Error("useNavigation must be used within a NavigationProvider");
//   }
//   return context;
// };

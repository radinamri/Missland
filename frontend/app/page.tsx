// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Post, PaginatedPostResponse, NavigationState } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useSearchStore } from "@/stores/searchStore";
import { useNavigationStore } from "@/stores/navigationStore"; // Re-introduced for view management
import PostGrid from "@/components/PostGrid";
import PostDetail from "@/components/PostDetail";
import LoadingSpinner from "@/components/LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";

export default function ExplorePage() {
  const router = useRouter();
  const { user, trackPostClick } = useAuth();
  const { searchTerm, filters } = useSearchStore();

  // --- RE-INTRODUCED: Navigation store is now the primary state manager ---
  const { stack, setStack, handlePostClick, handleGoBack } =
    useNavigationStore();

  const currentView = stack[stack.length - 1] || { type: "explore", posts: [] };
  const isDetailView = currentView?.type === "detail";

  // Local state for pagination and loading status of the explore feed
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODIFIED: fetchPosts now updates the navigationStore directly ---
  const fetchPosts = useCallback(
    async (isNewSearch = false) => {
      if (isNewSearch) {
        setIsLoading(true);
        window.scrollTo(0, 0);
      }

      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (filters.shape) params.append("shape", filters.shape);
      if (filters.pattern) params.append("pattern", filters.pattern);
      if (filters.size) params.append("size", filters.size);
      if (filters.color) params.append("color", filters.color);

      const currentPage = isNewSearch ? 1 : page;
      params.append("page", String(currentPage));

      try {
        const response = await api.get<PaginatedPostResponse>(
          `/api/auth/posts/filter/?${params.toString()}`
        );

        const newPosts = response.data.results;

        // Update the posts within the zustand store
        setStack((prevStack) => {
          const lastView = prevStack[prevStack.length - 1];
          if (lastView && lastView.type === "explore") {
            const updatedPosts = isNewSearch
              ? newPosts
              : [...lastView.posts, ...newPosts];
            const newExploreView: NavigationState = {
              ...lastView,
              posts: updatedPosts,
            };
            return [...prevStack.slice(0, -1), newExploreView];
          }
          // If stack is empty or not in explore, initialize it
          return [{ type: "explore", posts: newPosts, seed: "" }];
        });

        setHasMore(response.data.next !== null);
        setPage(isNewSearch ? 2 : (prevPage) => prevPage + 1);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, filters, page, setStack]
  );

  // Effect to trigger a new search when filters or term change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(true);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, filters, fetchPosts]);

  // Effect to handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // This is a simplified popstate, you might need more robust logic
      // based on your exact URL structure management in handlePostClick
      handleGoBack();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleGoBack]);

  return (
    <main className={isDetailView ? "" : "p-4 md:p-8"}>
      {/* --- REMOVED: The on-page FilterPanel is now gone --- */}

      {isLoading && currentView.posts.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <>
          {isDetailView && currentView.parentPost ? (
            <PostDetail
              post={currentView.parentPost}
              morePosts={currentView.posts}
              onMorePostClick={async (post) => {
                await trackPostClick(post.id);
                await handlePostClick(post);
              }}
              onBack={handleGoBack}
              onSave={() => {
                /* Implement save logic if needed */
              }}
            />
          ) : (
            <div className="mx-auto">
              <InfiniteScroll
                dataLength={currentView.posts.length}
                next={() => fetchPosts(false)}
                hasMore={hasMore}
                loader={<LoadingSpinner />}
                endMessage={
                  currentView.posts.length > 20 ? (
                    <p style={{ textAlign: "center", marginTop: "20px" }}>
                      <b>Yay! You have seen it all</b>
                    </p>
                  ) : null
                }
              >
                <PostGrid
                  posts={currentView.posts}
                  variant="explore"
                  onPostClick={async (post) => {
                    await trackPostClick(post.id);
                    await handlePostClick(post);
                  }}
                  // Other props like onSave can be wired up here
                />
              </InfiniteScroll>

              {!isLoading && currentView.posts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-lg text-gray-500">
                    No posts found for your criteria.
                  </p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your filters or search term.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

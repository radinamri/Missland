"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { useSearchStore } from "@/stores/searchStore";
import PostGrid from "@/components/PostGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostGridSkeleton from "@/components/PostGridSkeleton";
import InfiniteScroll from "react-infinite-scroll-component";

// Dynamic posts per page based on screen size/columns
// 5 cols (≥1280px) = 25, others (2/3/4 cols) = 24
const getPostsPerPage = () => {
  if (typeof window === "undefined") return 24;
  const width = window.innerWidth;
  if (width >= 1280) return 25; // 5 columns
  return 24; // 2, 3, or 4 columns
};

const SCROLL_POSITION_KEY = "explore-scroll-position";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export default function ExplorePage() {
  const { searchTerm, filters } = useSearchStore();
  const setIsRefreshing = useSearchStore((s) => s.setIsRefreshing);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [infiniteScrollKey, setInfiniteScrollKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(24);

  // Use refs instead of state for pagination to avoid dependency issues
  const pageRef = useRef(1);
  const postIdsSet = useRef<Set<number>>(new Set());
  const isFetchingRef = useRef(false);

  // Update posts per page on mount and window resize
  useEffect(() => {
    const updatePostsPerPage = () => {
      setPostsPerPage(getPostsPerPage());
    };
    
    updatePostsPerPage();
    window.addEventListener("resize", updatePostsPerPage);
    return () => window.removeEventListener("resize", updatePostsPerPage);
  }, []);

  /**
   * Professional fetch function with:
   * - Duplicate prevention using Set
   * - Page tracking via useRef (avoids dependency issues)
   * - Request deduplication
   * - Exponential backoff retry logic
   * - Comprehensive error handling
   * - Detailed logging for debugging
   * - Scroll position preservation
   */
  const fetchPosts = useCallback(
    async (isNewSearch = false, retryAttempt = 0) => {
      // Prevent concurrent requests
      if (isFetchingRef.current) {
        console.log("[fetchPosts] Request already in progress, skipping");
        return;
      }
      isFetchingRef.current = true;

      try {
        if (isNewSearch) {
          // Save scroll position before clearing posts
          if (typeof window !== "undefined") {
            sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
          }

          pageRef.current = 1;
          postIdsSet.current.clear();
          setPosts([]);
          setIsLoading(true);
          setHasMore(true);
          setError(null);
          setRetryCount(0);
          // Force InfiniteScroll to reset by changing key
          setInfiniteScrollKey((prev) => prev + 1);

          // Scroll to top smoothly
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }

        const params = new URLSearchParams();

        // Get all words from the current search term.
        const searchWords = searchTerm.toLowerCase().split(" ").filter(Boolean);

        // Create a set of all active filter values for easy lookup.
        const filterValues = new Set<string>();
        if (filters.shape) filterValues.add(filters.shape);
        if (filters.pattern) filterValues.add(filters.pattern);
        if (filters.size) filterValues.add(filters.size);
        filters.color.forEach((c) => filterValues.add(c));

        // Isolate the pure text query by filtering out words already handled by a filter.
        // This leaves only non-filter words like "nails", "design", etc.
        const textQueryParts = searchWords.filter(
          (word) => !filterValues.has(word)
        );
        const textQuery = textQueryParts.join(" ");

        // Build the final, clean URL parameters.
        if (textQuery) {
          params.append("q", textQuery);
        }
        if (filters.shape) {
          params.append("shape", filters.shape);
        }
        if (filters.pattern) {
          params.append("pattern", filters.pattern);
        }
        if (filters.size) {
          params.append("size", filters.size);
        }
        // Join the color array into a comma-separated string for the backend.
        if (filters.color.length > 0) {
          params.append("color", filters.color.join(","));
        }

        // Add cache-busting timestamp on page refresh (isNewSearch = true)
        // This ensures backend fetches fresh data and skips its 5-minute cache
        if (isNewSearch) {
          params.append("cache_bust", String(Date.now()));
        }

        const pageToFetch = isNewSearch ? 1 : pageRef.current;
        params.append("page", String(pageToFetch));
        params.append("page_size", String(postsPerPage));

        console.log(`[fetchPosts] Fetching page ${pageToFetch}, posts per page: ${postsPerPage}, current posts: ${posts.length}`);

        const response = await api.get<PaginatedPostResponse>(
          `/api/auth/posts/filter/?${params.toString()}`
        );
        const newPosts = response.data.results;

        console.log(`[fetchPosts] Received ${newPosts.length} posts, next: ${response.data.next ? 'yes' : 'no'}, total count: ${response.data.count}`);

        // Implement duplicate prevention
        setPosts((prevPosts) => {
          if (isNewSearch) {
            // Clear and repopulate the set
            postIdsSet.current.clear();
            newPosts.forEach((post) => postIdsSet.current.add(post.id));
            return newPosts;
          } else {
            // Filter out duplicates before adding
            const uniqueNewPosts = newPosts.filter(
              (post) => !postIdsSet.current.has(post.id)
            );
            uniqueNewPosts.forEach((post) => postIdsSet.current.add(post.id));
            console.log(`[fetchPosts] Added ${uniqueNewPosts.length} unique posts (filtered ${newPosts.length - uniqueNewPosts.length} duplicates)`);
            return [...prevPosts, ...uniqueNewPosts];
          }
        });

        const hasMorePosts = response.data.next !== null;
        setHasMore(hasMorePosts);
        console.log(`[fetchPosts] hasMore set to: ${hasMorePosts}`);

        // Always increment page after successful fetch for next request
        pageRef.current += 1;
        console.log(`[fetchPosts] Page incremented to: ${pageRef.current} for next fetch`);

        // Clear error on successful fetch
        setError(null);
        setRetryCount(0);
      } catch (error) {
        console.error(`[fetchPosts] Error on attempt ${retryAttempt + 1}:`, error);

        // Implement exponential backoff retry
        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryAttempt);
          console.log(`[fetchPosts] Retrying in ${delay}ms...`);
          setRetryCount(retryAttempt + 1);

          setTimeout(() => {
            isFetchingRef.current = false;
            fetchPosts(isNewSearch, retryAttempt + 1);
          }, delay);
          return;
        }

        // Max retries reached
        setError("Failed to load posts. Please try again.");
        setHasMore(false);
        console.error("[fetchPosts] Max retries reached, giving up");
      } finally {
        if (isNewSearch) {
          setIsLoading(false);
        }
        // Only release the lock if we're not retrying
        if (retryAttempt >= MAX_RETRY_ATTEMPTS || error === null) {
          isFetchingRef.current = false;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchTerm, filters]
  );

  // Effect to trigger a new search when filters or search term change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(true);
    }, 500); // Debounce to prevent rapid-fire requests
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  // Restore scroll position after posts are loaded (for back navigation)
  useEffect(() => {
    if (posts.length > 0 && typeof window !== "undefined") {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(0, position);
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        });
      }
    }
  }, [posts.length]);

  // Manual retry function
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    isFetchingRef.current = false;
    fetchPosts(false);
  };

  return (
    <main className="p-4 md:p-8 pb-16">
      <div className="mx-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                <InfiniteScroll
                  key={infiniteScrollKey}
                  dataLength={posts.length}
                  next={() => fetchPosts(false)}
                  hasMore={hasMore && !error}
                  loader={<PostGridSkeleton count={postsPerPage} />}
                  pullDownToRefresh={typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)}
                  pullDownToRefreshThreshold={80}
                  pullDownToRefreshContent={null}
                  refreshFunction={async () => {
                    try {
                      setIsRefreshing(true);
                      await new Promise((r) => setTimeout(r, 2000));
                      await fetchPosts(true);
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  endMessage={
                    <div className="col-span-full flex flex-col items-center justify-center py-12 mt-8">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-700">
                          ✨ You&apos;ve reached the end
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          No more posts to load. Try adjusting your filters!
                        </p>
                      </div>
                    </div>
                  }
                  scrollThreshold={0.8}
                >
                  <PostGrid posts={posts} variant="explore" />
                </InfiniteScroll>
                {error && (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 mt-4">
                    <div className="text-center max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-6">
                      <p className="text-base font-semibold text-red-700 mb-2">
                        {error}
                      </p>
                      <p className="text-sm text-red-600 mb-4">
                        {retryCount > 0 && `Attempted ${retryCount} time${retryCount > 1 ? 's' : ''}`}
                      </p>
                      <button
                        onClick={handleRetry}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg font-semibold text-gray-700">
                  No posts found
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

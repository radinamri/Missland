"use client";

import { useEffect, useState, useCallback } from "react";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { useSearchStore } from "@/stores/searchStore";
import PostGrid from "@/components/PostGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostGridSkeleton from "@/components/PostGridSkeleton";
import InfiniteScroll from "react-infinite-scroll-component";

const POSTS_PER_PAGE = 48;

export default function ExplorePage() {
  const { searchTerm, filters } = useSearchStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

      const pageToFetch = isNewSearch ? 1 : page;
      params.append("page", String(pageToFetch));
      params.append("page_size", String(POSTS_PER_PAGE));

      try {
        const response = await api.get<PaginatedPostResponse>(
          `/api/auth/posts/filter/?${params.toString()}`
        );
        const newPosts = response.data.results;

        setPosts((prevPosts) =>
          isNewSearch ? newPosts : [...prevPosts, ...newPosts]
        );
        setHasMore(response.data.next !== null);
        setPage(isNewSearch ? 2 : (prevPage) => prevPage + 1);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setHasMore(false);
      } finally {
        if (isNewSearch) {
          setIsLoading(false);
        }
      }
    },
    [searchTerm, filters, page]
  );

  // Effect to trigger a new search when filters or search term change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(true);
    }, 500);
    return () => clearTimeout(handler);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  return (
    <main className="p-4 md:p-8 pb-16">
      <div className="mx-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {posts.length > 0 ? (
              <InfiniteScroll
                dataLength={posts.length}
                next={() => fetchPosts(false)}
                hasMore={hasMore}
                loader={<PostGridSkeleton />}
                endMessage={
                  <p
                    style={{
                      textAlign: "center",
                      marginTop: "40px",
                      color: "#888",
                    }}
                  >
                    <b>You&apos;ve reached the end of the universe!</b>
                  </p>
                }
              >
                <PostGrid posts={posts} variant="explore" />
              </InfiniteScroll>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg text-gray-500">
                  No posts found for your criteria.
                </p>
                <p className="text-sm text-gray-400">
                  Try adjusting your filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

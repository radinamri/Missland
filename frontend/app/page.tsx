// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { useSearchStore } from "@/stores/searchStore";
import PostGrid from "@/components/PostGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination"; // Import our new component

const POSTS_PER_PAGE = 48; // Set our desired page size

export default function ExplorePage() {
  const { searchTerm, filters } = useSearchStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW STATE FOR PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPosts = useCallback(
    async (pageToFetch: number) => {
      setIsLoading(true);
      window.scrollTo(0, 0); // Scroll to top on every page change

      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (filters.shape) params.append("shape", filters.shape);
      if (filters.pattern) params.append("pattern", filters.pattern);
      if (filters.size) params.append("size", filters.size);
      if (filters.color) params.append("color", filters.color);

      params.append("page", String(pageToFetch));
      params.append("page_size", String(POSTS_PER_PAGE));

      try {
        const response = await api.get<PaginatedPostResponse>(
          `/api/auth/posts/filter/?${params.toString()}`
        );

        setPosts(response.data.results);
        // Calculate total pages based on the count from the API
        setTotalPages(Math.ceil((response.data.count || 0) / POSTS_PER_PAGE));
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, filters]
  );

  // Effect to trigger a new search when filters or term change (resets to page 1)
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1); // Reset to the first page for any new search
      fetchPosts(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, fetchPosts]);

  // Handler for the Pagination component
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPosts(page);
  };

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                <PostGrid posts={posts} variant="explore" />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
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

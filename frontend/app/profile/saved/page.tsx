"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Post } from "@/types";
import api from "@/utils/api";
import Toast from "@/components/Toast";
import PostGrid from "@/components/PostGrid";
import SearchInput from "@/components/SearchInput";

export default function SavedPostsPage() {
  const { user, tokens, isLoading: isAuthLoading, toggleSavePost } = useAuth();
  const router = useRouter();

  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Protect the route
  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  // Fetch saved posts
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      api
        .get<Post[]>("/api/auth/profile/saved-posts/")
        .then((response) => {
          setSavedPosts(response.data);
          setFilteredPosts(response.data);
        })
        .catch((error) => console.error("Failed to fetch saved posts", error))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  // Handle search filtering
  useEffect(() => {
    const results = savedPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags &&
          post.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
    setFilteredPosts(results);
  }, [searchTerm, savedPosts]);

  const handleRemovePost = async (postId: number) => {
    const message = await toggleSavePost(postId);
    if (message) {
      const updatedPosts = savedPosts.filter((p) => p.id !== postId);
      setSavedPosts(updatedPosts);
      setFilteredPosts(updatedPosts);
      setToastMessage("Post removed from your collection.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading Saved Posts...
        </p>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMessage} show={showToast} />
      <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
        <header className="mb-8">
          <div className="flex justify-start mb-4">
            <Link
              href="/profile"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to Profile
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            My Saved Posts
          </h1>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchInput
            placeholder="Search nails, hair styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredPosts.length > 0 ? (
          // Replaced the duplicated grid with the reusable PostGrid component
          <PostGrid
            posts={filteredPosts}
            variant="saved"
            onRemove={handleRemovePost}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Saved Posts Found
            </h2>
            <p className="text-gray-500">
              {searchTerm
                ? "Try a different search term."
                : "Posts you save from the Explore page will appear here."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

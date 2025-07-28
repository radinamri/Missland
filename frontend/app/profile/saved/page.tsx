// src/app/profile/saved/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Post } from "@/types";
import api from "@/utils/api";
import Image from "next/image";
import Toast from "@/components/Toast"; // Import the Toast component

// --- A new, dedicated card component for this page ---
const SavedPostCard = ({
  post,
  onRemove,
}: {
  post: Post;
  onRemove: (postId: number) => void;
}) => {
  return (
    <div className="rounded-lg overflow-hidden aspect-square group relative">
      <Image
        src={post.image_url}
        alt={post.title}
        width={post.width}
        height={post.height}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* This overlay is now always visible on mobile, and appears on hover on desktop */}
      <div className="absolute inset-0 flex flex-col justify-between p-2 transition-opacity duration-300 md:bg-gradient-to-t from-black/60 to-transparent md:opacity-0 group-hover:opacity-100">
        <p className="text-white text-xs font-semibold drop-shadow-md">
          {post.title}
        </p>
        <button
          onClick={() => onRemove(post.id)}
          className="self-end bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-transform hover:scale-110"
          aria-label="Remove post"
        >
          {/* Remove Icon (Trash Can) */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function SavedPostsPage() {
  const { user, tokens, isLoading: isAuthLoading, toggleSavePost } = useAuth();
  const router = useRouter();

  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State for the toast notification
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

  // --- Handler for removing a post ---
  const handleRemovePost = async (postId: number) => {
    const message = await toggleSavePost(postId);
    if (message) {
      // Update state to remove the post from the UI instantly
      const updatedPosts = savedPosts.filter((p) => p.id !== postId);
      setSavedPosts(updatedPosts);
      setFilteredPosts(updatedPosts);

      // Show confirmation toast
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
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search in your saved posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 border border-gray-300 rounded-full py-3 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          {/* --- Corrected the typo in the className here --- */}
          <svg
            className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredPosts.map((post) => (
              <SavedPostCard
                key={post.id}
                post={post}
                onRemove={handleRemovePost}
              />
            ))}
          </div>
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

"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";
import Toast from "@/components/Toast";
import PostGrid from "@/components/PostGrid"; // Import the new PostGrid component

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, toggleSavePost } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get<Post[]>("/api/auth/posts/");
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleSaveClick = async (postId: number) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      const message = await toggleSavePost(postId);
      if (message) {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <Toast message={toastMessage} show={showToast} />

      <div className="bg-white md:shadow-lg p-4 md:p-8">
        <header className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search nails, hair styles..."
              className="w-full bg-gray-100 border border-gray-300 rounded-full py-3 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
            />
            <svg
              className="w-6 h-6 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2"
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
        </header>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading styles...</p>
        ) : (
          <PostGrid posts={posts} onSaveClick={handleSaveClick} />
        )}
      </div>
    </>
  );
}

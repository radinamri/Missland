"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";
import Toast from "@/components/Toast";
import PostGrid from "@/components/PostGrid";
import SearchInput from "@/components/SearchInput";

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Reverted to the simpler useAuth destructuring
  const { user, toggleSavePost } = useAuth();

  // Restored local state for the modal and toast
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Add state to manage the search input's value
  const [searchTerm, setSearchTerm] = useState("");

  // Filter the posts based on the search term
  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Reverted to the simpler handleSaveClick logic
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
      {/* Restored the local Toast component */}
      <Toast message={toastMessage} show={showToast} />

      <div className="bg-white md:shadow-lg p-4 md:p-8">
        <SearchInput
          placeholder="Search nails, hair styles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {isLoading ? (
          <p className="text-center text-gray-500">Loading styles...</p>
        ) : (
          <PostGrid
            posts={filteredPosts}
            variant="explore"
            onSave={handleSaveClick}
          />
        )}
      </div>
    </>
  );
}

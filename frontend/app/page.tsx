"use client";

import { useEffect, useState, useMemo } from "react";
import { Post } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";
import Toast from "@/components/Toast";
import PostGrid from "@/components/PostGrid";
import SearchInput from "@/components/SearchInput";
import CategoryFilters from "@/components/CategoryFilters";
import SignUpPopup from "@/components/SignUpPopup";

export default function ExplorePage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, toggleSavePost } = useAuth();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch all posts once on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get<Post[]>("/api/auth/posts/");
        setAllPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // --- Logic for Filtering ---

  // 1. Get a unique list of all categories from the posts
  const allCategories = useMemo(() => {
    const tags = new Set(allPosts.flatMap((post) => post.tags));
    return Array.from(tags);
  }, [allPosts]);

  // 2. Filter posts based on both search term and active category
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesCategory = activeCategory
        ? post.tags.includes(activeCategory)
        : true;
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, activeCategory, searchTerm]);

  // useEffect to handle showing the pop-up on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!user && window.scrollY > 400) {
        setShowSignUpPopup(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    if (!user) {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [user]);

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

  const handleSelectCategory = (category: string | null) => {
    setActiveCategory(category);
  };

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <Toast message={toastMessage} show={showToast} />
      <SignUpPopup
        show={showSignUpPopup}
        onClose={() => setShowSignUpPopup(false)}
      />

      <div className="bg-white md:shadow-lg p-4 md:p-8">
        <SearchInput
          placeholder="Search nails, hair styles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <CategoryFilters
          categories={allCategories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
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

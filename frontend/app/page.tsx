"use client";

import { useEffect, useState, useMemo } from "react";
import { Post } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import LoginModal from "@/components/LoginModal";
import PostGrid from "@/components/PostGrid";
import SearchInput from "@/components/SearchInput";
import SignUpPopup from "@/components/SignUpPopup";
import Toast from "@/components/Toast";

export default function ExplorePage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    user,
    toggleSavePost,
    trackPostClick,
    trackSearchQuery,
    interactionCount,
  } = useAuth();
  const { searchTerm, setSearchTerm, setAllCategories } = useSearch();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<Post[]>("/api/auth/posts/");
        setAllPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch initial posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPosts();
  }, []);

  useEffect(() => {
    const fetchForYouPosts = async () => {
      // Only run if the user is logged in and has interacted.
      if (user && interactionCount > 0) {
        setIsLoading(true);
        try {
          const response = await api.get<Post[]>("/api/auth/posts/for-you/");
          setAllPosts(response.data); // Replace the generic feed with the personalized one
        } catch (error) {
          console.error("Failed to fetch for-you posts:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // We don't run this on the very first render, only on subsequent interactions.
    if (interactionCount > 0) {
      fetchForYouPosts();
    }
  }, [user, interactionCount]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const endpoint = user ? "/api/auth/posts/for-you/" : "/api/auth/posts/";
        const response = await api.get<Post[]>(endpoint);
        setAllPosts(response.data);
        const tags = new Set(response.data.flatMap((post) => post.tags));
        setAllCategories(Array.from(tags));
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [user, setAllCategories]);

  const allCategories = useMemo(() => {
    const tags = new Set(allPosts.flatMap((post) => post.tags));
    return Array.from(tags);
  }, [allPosts]);

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
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleSuggestionClick = (category: string) => {
    // When a user clicks a suggestion, we can set it as the active filter
    setActiveCategory(category);
    // And also update the search term for a seamless experience
    setSearchTerm(category);
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
        {/* Search Input is now only shown on mobile screens */}
        <div className="block md:hidden mb-4">
          <SearchInput
            placeholder="Search nails, hair styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearchSubmit={trackSearchQuery}
            categories={allCategories}
            onCategoryClick={handleSuggestionClick}
          />
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-10">Loading styles...</p>
        ) : (
          <PostGrid
            posts={filteredPosts}
            variant="explore"
            onSave={handleSaveClick}
            onPostClick={trackPostClick}
          />
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useSearch } from "@/context/SearchContext";
import { useNavigation } from "@/context/NavigationContext";
import LoginModal from "@/components/LoginModal";
import PostGrid from "@/components/PostGrid";
import SignUpPopup from "@/components/SignUpPopup";
import Toast from "@/components/Toast";
import SearchInput from "@/components/SearchInput";

export default function ExplorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, toggleSavePost, trackPostClick, trackSearchQuery } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    allCategories,
    setAllCategories,
    activeCategory,
    setActiveCategory,
  } = useSearch();
  const router = useRouter();

  const { currentView, handlePostClick, initializeFeed } = useNavigation();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      if (currentView) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const endpoint = user ? "/api/auth/posts/for-you/" : "/api/auth/posts/";

        const response = await api.get<PaginatedPostResponse>(endpoint);

        const allFetchedCategories = Array.from(
          new Set(response.data.results.flatMap((post) => post.tags))
        );
        setAllCategories(allFetchedCategories);

        initializeFeed({
          type: "explore",
          posts: response.data.results,
          seed: response.data.seed,
        });
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPosts();
  }, [user, initializeFeed, currentView, setAllCategories]);

  const handleGridPostClick = async (post: Post) => {
    await trackPostClick(post.id);
    handlePostClick(post);
    router.push(`/post/${post.id}`, { scroll: false });
  };

  const filteredPosts = useMemo(() => {
    if (!currentView?.posts) return [];

    return currentView.posts.filter((post) => {
      const matchesCategory = activeCategory
        ? post.tags.includes(activeCategory)
        : true;
      const matchesSearch =
        searchTerm.trim() === ""
          ? true
          : post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
      return matchesCategory && matchesSearch;
    });
  }, [currentView, activeCategory, searchTerm]);

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

  const handleSuggestionClick = (category: string | null) => {
    setActiveCategory(category);
    setSearchTerm("");
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

      <main className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
        <div className="mb-8">
          <div className="md:hidden">
            <SearchInput
              placeholder="Search nails, styles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearchSubmit={trackSearchQuery}
              categories={allCategories}
              onCategoryClick={handleSuggestionClick}
              activeCategory={activeCategory}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500">Loading your feed...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <PostGrid
            posts={filteredPosts}
            variant="explore"
            onSave={handleSaveClick}
            onPostClick={handleGridPostClick}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500">No posts found.</p>
          </div>
        )}
      </main>
    </>
  );
}

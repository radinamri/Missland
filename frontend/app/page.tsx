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
import SearchInput from "@/components/SearchInput";
import SaveToCollectionModal from "@/components/SaveToCollectionModal";

export default function ExplorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, trackPostClick, trackSearchQuery } = useAuth();
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
  const [postToSave, setPostToSave] = useState<Post | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
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

  const openSaveModal = (post: Post) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setPostToSave(post);
      setShowCollectionsModal(true);
    }
  };

  const handleSuggestionClick = (category: string | null) => {
    setActiveCategory(category);
    setSearchTerm("");
  };

  const handleSwitchToLogin = () => {
    setShowSignUpPopup(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={postToSave}
      />
      <SignUpPopup
        show={showSignUpPopup}
        onClose={() => setShowSignUpPopup(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <main className="bg-gray-50 p-4 md:p-8">
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
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#3D5A6C]"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <PostGrid
            posts={filteredPosts}
            variant="explore"
            onSave={openSaveModal}
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

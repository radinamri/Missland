"use client";

import { useEffect, useState, useMemo } from "react";
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
import PostDetail from "@/components/PostDetail";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ExplorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    user,
    trackPostClick,
    trackSearchQuery,
    collections,
    showToastWithMessage,
  } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    allCategories,
    setAllCategories,
    activeCategory,
    setActiveCategory,
  } = useSearch();

  const { currentView, handlePostClick, handleGoBack, initializeFeed } =
    useNavigation();

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
          seed: String(response.data.seed ?? ""),
        });
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPosts();
  }, [user, initializeFeed, currentView, setAllCategories]);

  useEffect(() => {
    if (
      user &&
      !isLoading &&
      currentView?.posts &&
      currentView.posts.length > 0
    ) {
      const pendingIdStr = localStorage.getItem("pendingSavePostId");
      if (pendingIdStr) {
        const postId = parseInt(pendingIdStr, 10);
        const post = currentView.posts.find((p) => p.id === postId);
        if (post) {
          setPostToSave(post);
          setShowCollectionsModal(true);
          trackPostClick(post.id).catch(console.error);
          showToastWithMessage("Now saving the post to your collection!");
        } else {
          showToastWithMessage(
            "Post not available right now. Please try again."
          );
        }
        localStorage.removeItem("pendingSavePostId");
      }
    }
  }, [user, currentView, isLoading, trackPostClick, showToastWithMessage]);

  const handleGridPostClick = async (post: Post) => {
    await trackPostClick(post.id);
    handlePostClick(post);
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
      localStorage.setItem("pendingSavePostId", post.id.toString());
      setShowLoginModal(true);
      showToastWithMessage("Please log in to save this post.");
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

  const isDetailView = currentView?.type === "detail";

  return (
    <>
      <div className="relative min-h-screen">
        <div className="fixed top-0 left-0 w-full h-screen bg-gradient-to-r from-pink-50 to-blue-50 z-0" />
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

        <main className="p-4 md:p-8">
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
            <LoadingSpinner />
          ) : (
            <>
              {isDetailView && currentView.parentPost && (
                <PostDetail
                  post={currentView.parentPost}
                  morePosts={filteredPosts}
                  onMorePostClick={async (post) => {
                    await trackPostClick(post.id);
                    handlePostClick(post);
                  }}
                  onSave={openSaveModal}
                  onBack={handleGoBack}
                  onOpenLoginModal={() => setShowLoginModal(true)}
                />
              )}

              {!isDetailView && filteredPosts.length > 0 ? (
                <PostGrid
                  posts={filteredPosts}
                  variant="explore"
                  onSave={openSaveModal}
                  onPostClick={handleGridPostClick}
                  isSaved={(p) =>
                    collections?.some((c) =>
                      (c.posts || []).some((cp) => cp.id === p.id)
                    ) ?? false
                  }
                />
              ) : null}

              {filteredPosts.length === 0 && !isDetailView && (
                <div className="text-center py-20">
                  <p className="text-lg text-gray-500">No posts found.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

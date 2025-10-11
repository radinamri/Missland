"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Post, PaginatedPostResponse, NavigationState } from "@/types";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useSearchStore } from "@/stores/searchStore";
import { useNavigationStore } from "@/stores/navigationStore";
import LoginModal from "@/components/LoginModal";
import PostGrid from "@/components/PostGrid";
import SignUpPopup from "@/components/SignUpPopup";
import SaveToCollectionModal from "@/components/SaveToCollectionModal";
import PostDetail from "@/components/PostDetail";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ExplorePage() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { user, trackPostClick, collections, showToastWithMessage } = useAuth();
  const { searchTerm, setAllCategories, activeCategory } = useSearchStore();
  const { stack, handlePostClick, handleGoBack, setStack } =
    useNavigationStore();

  const currentView = stack[stack.length - 1] || null;
  const isDetailView = currentView?.type === "detail";

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  // Ref to track the previous stack top for comparison
  const prevStackTopRef = useRef<NavigationState | null>(null);

  // Initialize based on pathname (handles refresh on /post/[id])
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        if (pathname.startsWith("/post/")) {
          const postId = parseInt(pathname.split("/post/")[1], 10);
          if (isNaN(postId)) throw new Error("Invalid post ID");

          const [postRes, moreRes] = await Promise.all([
            api.get<Post>(`/api/auth/posts/${postId}/`),
            api.get<PaginatedPostResponse>(`/api/auth/posts/${postId}/more/`),
          ]);

          const post = postRes.data;
          const morePosts = moreRes.data.results;

          const categories = Array.from(
            new Set([
              ...(post.tags || []),
              ...morePosts.flatMap((p) => p.tags || []),
            ])
          );
          setAllCategories(categories);

          // Initialize or update detail view if post or stack top changed
          const currentTop = stack[stack.length - 1];
          if (
            !prevStackTopRef.current ||
            currentTop?.type !== "detail" ||
            (currentTop?.type === "detail" &&
              currentTop.parentPost &&
              currentTop.parentPost.id !== post.id)
          ) {
            setStack((prev) => {
              if (
                prev.length === 0 ||
                prev[prev.length - 1].type !== "detail"
              ) {
                return [
                  { type: "explore" as const, posts: [], seed: "" }, // Placeholder base
                  {
                    type: "detail",
                    parentPost: post,
                    posts: morePosts,
                    seed: String(moreRes.data.seed ?? ""),
                  },
                ];
              }
              return prev.map((view, index) =>
                index === prev.length - 1
                  ? {
                      ...view,
                      parentPost: post,
                      posts: morePosts,
                      seed: String(moreRes.data.seed ?? ""),
                    }
                  : view
              );
            });
            prevStackTopRef.current = currentTop;
          }
        } else {
          // Normal explore init if not already in explore
          const endpoint = user
            ? "/api/auth/posts/for-you/"
            : "/api/auth/posts/";
          const res = await api.get<PaginatedPostResponse>(endpoint);

          const categories = Array.from(
            new Set(res.data.results.flatMap((p) => p.tags))
          );
          setAllCategories(categories);

          setStack((prev) => {
            if (prev.length === 0 || prev[prev.length - 1].type !== "explore") {
              return [
                {
                  type: "explore" as const,
                  posts: res.data.results,
                  seed: String(res.data.seed ?? ""),
                },
              ];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        router.push("/"); // Fallback to explore
      } finally {
        setIsLoading(false);
      }
    };

    init(); // Run on every pathname or stack change
  }, [user, pathname, setAllCategories, setStack, router, stack]);

  // Handle pending save post
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

  // Handle scroll for signup popup
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

  // Handle popstate for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setStack((prev: NavigationState[]) =>
        prev.length > 1 ? prev.slice(0, -1) : prev
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setStack]);

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

  const handleSwitchToLogin = () => {
    setShowSignUpPopup(false);
    setShowLoginModal(true);
  };

  return (
    <main className={isDetailView ? "" : "p-4 md:p-8"}>
      {/* Conditional padding */}
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
              onPostClick={async (post) => {
                await trackPostClick(post.id);
                handlePostClick(post);
              }}
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
  );
}

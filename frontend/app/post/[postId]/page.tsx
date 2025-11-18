// app/post/[postId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { Post, PaginatedPostResponse, NavigationState } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuth } from "@/context/AuthContext";

const POST_DETAIL_STATE_KEY = "post-detail-state";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const [data, setData] = useState<{
    post: Post;
    morePosts: Post[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setStack } = useNavigationStore();
  const { user, trackPostClick, showToastWithMessage } = useAuth();

  // Save current post detail state on mount (for when clicking "more" posts)
  useEffect(() => {
    return () => {
      // Save state before unmounting (when navigating away)
      if (data && typeof window !== "undefined") {
        const stateToSave = {
          post: data.post,
          morePosts: data.morePosts,
          scrollPosition: window.scrollY,
        };
        sessionStorage.setItem(POST_DETAIL_STATE_KEY, JSON.stringify(stateToSave));
      }
    };
  }, [data]);

  useEffect(() => {
    async function getPostData() {
      if (!postId) return;
      try {
        setIsLoading(true);
        const postPromise = api.get<Post>(`/api/auth/posts/${postId}/`);
        const morePostsPromise = api.get<PaginatedPostResponse>(
          `/api/auth/posts/${postId}/more/`
        );

        const [postResponse, morePostsResponse] = await Promise.all([
          postPromise,
          morePostsPromise,
        ]);

        const post = postResponse.data;
        const morePosts = morePostsResponse.data.results;

        // --- FIX: Logic using old 'tags' and 'setAllCategories' is removed ---

        // Update navigation stack so the back button works correctly
        const newView: NavigationState = {
          type: "detail",
          parentPost: post,
          posts: morePosts,
          seed: String(morePostsResponse.data.seed ?? ""),
        };
        setStack(() => [
          // Create a base 'explore' layer for the back button
          { type: "explore" as const, posts: [], seed: "" },
          newView,
        ]);

        setData({ post, morePosts });
      } catch (error) {
        console.error("Failed to fetch post data for full page", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    getPostData();
  }, [postId, setStack]);

  const openSaveModal = (post: Post) => {
    if (!user) {
      localStorage.setItem("pendingSavePostId", post.id.toString());
      showToastWithMessage("Please log in to save this post.");
      router.push("/login");
    } else {
      // The save modal logic is handled inside PostDetail, so we just need to trigger it
      // This can be done by passing a function to PostDetail or letting it handle its own state
      showToastWithMessage("Opening save to collection modal.");
    }
  };

  const handleBackToExplore = () => {
    console.log("[PostPage] Back button clicked, returning to explore");
    router.push("/");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="md:pt-10">
      <PostDetail
        post={data.post}
        morePosts={data.morePosts}
        onMorePostClick={async (post: Post) => {
          await trackPostClick(post.id);
          // For direct navigation, clicking a "more" post should navigate to its own page
          router.push(`/post/${post.id}`);
        }}
        onSave={openSaveModal}
        onBack={handleBackToExplore} // Go back to the main explore page
        onOpenLoginModal={() => router.push("/login")}
      />
    </div>
  );
}

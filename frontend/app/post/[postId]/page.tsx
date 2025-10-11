// app/post/[postId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { Post, PaginatedPostResponse, NavigationState } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSearchStore } from "@/stores/searchStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useAuth } from "@/context/AuthContext";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const [data, setData] = useState<{
    post: Post;
    morePosts: Post[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setAllCategories } = useSearchStore();
  const { setStack, handlePostClick, handleGoBack } = useNavigationStore();
  const { user, trackPostClick, showToastWithMessage } = useAuth();

  useEffect(() => {
    async function getPostData() {
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

        console.log("Post data:", postResponse.data);
        console.log("More posts data:", morePostsResponse.data.results);

        // Update allCategories with tags from post and morePosts
        const allFetchedCategories = Array.from(
          new Set([
            ...(postResponse.data.tags || []),
            ...morePostsResponse.data.results.flatMap(
              (post) => post.tags || []
            ),
          ])
        );
        setAllCategories(allFetchedCategories);

        // Update navigation stack to include this post detail view
        const newView: NavigationState = {
          type: "detail",
          parentPost: postResponse.data,
          posts: morePostsResponse.data.results,
          seed: String(morePostsResponse.data.seed ?? ""),
        };
        setStack((prev) => {
          // Replace or append to stack to avoid duplicates
          const baseStack: NavigationState[] =
            prev.length === 0 || prev[0].type !== "explore"
              ? [{ type: "explore" as const, posts: [], seed: "" }]
              : prev.slice(0, 1);
          return [...baseStack, newView];
        });

        setData({
          post: postResponse.data,
          morePosts: morePostsResponse.data.results,
        });
      } catch (error) {
        console.error("Failed to fetch post data for full page", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (postId) {
      getPostData();
    }
  }, [postId, setAllCategories, setStack]);

  const openSaveModal = (post: Post) => {
    if (!user) {
      localStorage.setItem("pendingSavePostId", post.id.toString());
      showToastWithMessage("Please log in to save this post.");
      router.push("/login");
    } else {
      showToastWithMessage("Opening save to collection modal.");
      // Note: SaveToCollectionModal is handled in PostDetail
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="md:px-8 md:pt-12">
      <PostDetail
        post={data.post}
        morePosts={data.morePosts}
        onMorePostClick={async (post: Post) => {
          await trackPostClick(post.id);
          await handlePostClick(post);
        }}
        onSave={openSaveModal}
        onBack={handleGoBack}
        onOpenLoginModal={() => router.push("/login")}
      />
    </div>
  );
}

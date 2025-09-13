"use client";

import TryOnPostDetail from "@/components/TryOnPostDetail";
import { Post, TryOn } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TryOnPostPage() {
  const {
    user,
    isLoading: isAuthLoading,
    tokens,
    deleteTryOn,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [morePosts, setMorePosts] = useState<Post[]>([]);
  const [tryOns, setTryOns] = useState<TryOn[]>([]); // New state for try-ons
  const [isLoading, setIsLoading] = useState(true);

  const fetchPostData = useCallback(async () => {
    if (user && postId) {
      try {
        const [postResponse, tryOnsResponse] = await Promise.all([
          api.get<Post>(`/api/auth/posts/${postId}/`),
          api.get<TryOn[]>(`/api/auth/profile/my-try-ons/`),
        ]);
        setPost(postResponse.data);
        setTryOns(tryOnsResponse.data); // Store try-ons in state
        // Filter out the current post from morePosts
        setMorePosts(
          tryOnsResponse.data
            .map((tryOn) => tryOn.post)
            .filter((p) => p.id !== Number(postId))
        );
      } catch (error) {
        console.error("Failed to fetch post data", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, postId]);

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const handleRemovePost = async (postId: number) => {
    const tryOnToRemove = tryOns.find(
      (tryOn: TryOn) => tryOn.post.id === postId
    );
    if (!tryOnToRemove) return;

    const message = await deleteTryOn(tryOnToRemove.id);
    if (message) {
      showToastWithMessage(message);
      router.push("/profile/my-try-ons");
    }
  };

  if (isLoading || isAuthLoading || !post) {
    return <LoadingSpinner />;
  }

  return (
    <TryOnPostDetail
      post={post}
      morePosts={morePosts}
      onMorePostClick={async (p: Post) => {
        router.push(`/profile/my-try-ons/${p.id}`);
      }}
      onRemove={handleRemovePost}
    />
  );
}

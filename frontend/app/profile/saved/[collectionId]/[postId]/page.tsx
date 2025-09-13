"use client";

import SavedPostDetail from "@/components/SavedPostDetail";
import { Post, CollectionDetail } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SavedPostPage() {
  const {
    user,
    isLoading: isAuthLoading,
    tokens,
    managePostInCollection,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [morePosts, setMorePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPostData = useCallback(async () => {
    if (user && collectionId && postId) {
      try {
        const [postResponse, collectionResponse] = await Promise.all([
          api.get<Post>(`/api/auth/posts/${postId}/`),
          api.get<CollectionDetail>(`/api/auth/collections/${collectionId}/`),
        ]);
        setPost(postResponse.data);
        // Filter out the current post from morePosts
        setMorePosts(
          collectionResponse.data.posts.filter((p) => p.id !== Number(postId))
        );
      } catch (error) {
        console.error("Failed to fetch post data", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, collectionId, postId]);

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  const handleRemovePost = async (postId: number) => {
    const message = await managePostInCollection(Number(collectionId), postId);
    if (message) {
      showToastWithMessage(message);
      router.push(`/profile/saved/${collectionId}`);
    }
  };

  if (isLoading || isAuthLoading || !post) {
    return <LoadingSpinner />;
  }

  return (
    <SavedPostDetail
      post={post}
      morePosts={morePosts}
      onMorePostClick={async (p: Post) => {
        router.push(`/profile/saved/${collectionId}/${p.id}`);
      }}
      onRemove={handleRemovePost}
      collectionId={collectionId}
    />
  );
}

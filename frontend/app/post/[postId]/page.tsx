"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [data, setData] = useState<{
    post: Post;
    morePosts: Post[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [postId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    notFound();
  }

  return (
    <PostDetail
      post={data.post}
      morePosts={data.morePosts}
      onMorePostClick={async (post: Post) => {
        window.location.href = `/post/${post.id}`;
      }}
      onSave={(post: Post) => {
        console.log("Save post:", post.id);
      }}
      onBack={() => {
        window.history.back();
      }}
    />
  );
}

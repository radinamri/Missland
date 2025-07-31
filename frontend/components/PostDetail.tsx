"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types";
import api from "@/utils/api";
import Image from "next/image";
import PostGrid from "./PostGrid";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [morePosts, setMorePosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, toggleSavePost, showToastWithMessage } = useAuth();

  useEffect(() => {
    if (postId) {
      setIsLoading(true);
      // Fetch the main post and "more posts" in parallel for faster loading
      Promise.all([
        api.get<Post>(`/api/auth/posts/${postId}/`),
        api.get<Post[]>(`/api/auth/posts/${postId}/more/`),
      ])
        .then(([postResponse, morePostsResponse]) => {
          setPost(postResponse.data);
          setMorePosts(morePostsResponse.data);
        })
        .catch((error) => {
          console.error("Failed to fetch post details", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [postId]);

  const handleSaveClick = async (id: number) => {
    if (!user) {
      alert("Please log in to save posts.");
      return;
    }
    const message = await toggleSavePost(id);
    if (message) {
      showToastWithMessage(message);
    }
  };

  if (isLoading || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500 animate-pulse">Loading Post...</p>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-y-auto max-h-[90vh]">
      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto rounded-4xl shadow-lg p-4 md:p-8">
          {/* Left Column: Image */}
          <div className="w-full">
            <Image
              src={post.image_url}
              alt={post.title}
              width={post.width}
              height={post.height}
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
          {/* Right Column: Details */}
          <div className="flex flex-col">
            {/* Action Bar */}
            <div className="flex items-center justify-end mb-6 space-x-3">
              <Link
                href={`/try-on/${post.id}`}
                className="bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-2xl hover:bg-gray-200 transition"
              >
                Try On
              </Link>
              <button
                onClick={() => handleSaveClick(post.id)}
                className="bg-pink-500 text-white font-bold py-3 px-6 rounded-2xl hover:bg-pink-600 transition"
              >
                Save
              </button>
            </div>

            {/* Title and Info */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                  N
                </div>
                <div>
                  <p className="font-semibold text-gray-800">NANA-AI</p>
                  <p className="text-sm text-gray-500">Curated Style</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags &&
                  Object.values(post.tags).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          More to explore
        </h2>
        <PostGrid
          posts={morePosts}
          variant="explore"
          onSave={handleSaveClick}
        />
      </div>
    </div>
  );
}

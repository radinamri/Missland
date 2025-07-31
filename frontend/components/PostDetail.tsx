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
      // Fetch the main post
      api
        .get<Post>(`/api/auth/posts/${postId}/`)
        .then((res) => setPost(res.data));
      // Fetch other posts to explore
      api
        .get<Post[]>(`/api/auth/posts/${postId}/more/`)
        .then((res) => setMorePosts(res.data));
      setIsLoading(false);
    }
  }, [postId]);

  const handleSaveClick = async (id: number) => {
    if (!user) {
      // This could be replaced with a login modal trigger in the future
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
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left: Image */}
          <div className="overflow-hidden">
            <Image
              src={post.image_url}
              alt={post.title}
              width={post.width}
              height={post.height}
              className="w-full h-auto rounded-2xl md:max-w-sm"
            />
          </div>
          {/* Right: Details */}
          <div className="flex flex-col">
            <div className="flex items-center justify-end mb-4 space-x-2">
              <Link
                href={`/try-on/${post.id}`}
                className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-2xl hover:bg-gray-300 transition"
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {post.title}
            </h1>
            <p className="text-gray-500 mt-2">Style by NANA-AI</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 py-8 border-t">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
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

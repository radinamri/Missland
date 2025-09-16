// app/share/post/[postId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user, managePostInCollection, showToastWithMessage } = useAuth();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (postId) {
      // Fetch post data
      api
        .get<Post>(`/api/public/posts/${postId}/`)
        .then((response) => setPost(response.data))
        .catch(() => router.push("/")); // Redirect home if post not found
    }
  }, [postId, router]);

  const handleSaveToCollection = async () => {
    if (!user || !post) {
      showToastWithMessage("Please log in to save to a collection.");
      return;
    }
    try {
      // Assuming collection ID 1 as default; adjust based on your app's logic
      const response = await managePostInCollection(1, post.id);
      if (response) {
        showToastWithMessage(response);
      }
    } catch (error) {
      console.error("Failed to save to collection:", error);
      showToastWithMessage("Failed to save to collection.");
    }
  };

  if (!post) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>

        <div className="rounded-xl overflow-hidden mb-6 aspect-w-1 aspect-h-1">
          <Image
            src={post.try_on_image_url}
            alt={`Try-on result for ${post.title}`}
            width={500}
            height={500}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href={`/try-on/${post.id}`}
            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition"
          >
            Try On Yourself
          </Link>
          {user ? (
            <button
              onClick={handleSaveToCollection}
              className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Save to Collection
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition"
            >
              Login or Sign Up
            </Link>
          )}
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
}

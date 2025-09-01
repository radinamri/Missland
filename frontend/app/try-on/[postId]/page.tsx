"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Post } from "@/types";
import api from "@/utils/api";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function TryOnPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user, saveTryOn, showToastWithMessage } = useAuth();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (postId) {
      // This is a protected feature, so we use the authenticated endpoint
      api
        .get<Post>(`/api/auth/posts/${postId}/`)
        .then((response) => setPost(response.data))
        .catch(() => router.push("/")); // Redirect home if post not found
    }
  }, [postId, router]);

  const handleSave = async () => {
    if (!user || !post) return router.push("/login");
    const message = await saveTryOn(post.id);
    if (message) {
      showToastWithMessage(message);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/share/post/${post.id}`;
    const shareData = {
      title: `Check out this style: ${post.title}`,
      text: `I just tried on the "${post.title}" style on NANA-AI! Try it yourself.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop or browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareUrl);
        showToastWithMessage("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      showToastWithMessage("Could not share at this time.");
    }
  };

  if (!post) {
    return (
      <div className="text-center py-20">
        <p>Loading Style...</p>
      </div>
    );
  }

  // This page is now designed for mobile first
  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{post.title}</h1>
          <p className="text-gray-500">Virtual Try-On Result</p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
          <Image
            src={post.try_on_image_url}
            alt={`Try-on result for ${post.title}`}
            width={500}
            height={500}
            className="w-full h-auto"
            priority
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleSave}
            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition"
          >
            Save to My Try-Ons
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

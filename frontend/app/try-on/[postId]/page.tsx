"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Post } from "@/types";
import api from "@/utils/api";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TryOnPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user, saveTryOn, showToastWithMessage } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (postId) {
      // This is a protected feature, so we use the authenticated endpoint
      api
        .get<Post>(`/api/public/posts/${postId}/`)
        .then((response) => setPost(response.data))
        .catch(() => router.push("/")); // Redirect home if post not found
    }
  }, [postId, router]);

  const handleSave = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (post) {
      const message = await saveTryOn(post.id);
      if (message) {
        showToastWithMessage(message);
      }
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/share/post/${post.id}`;
    const shareData = {
      title: `Check out this style: ${post.title}`,
      text: `I just tried on the "${post.title}" style on Missland! Try it yourself.`,
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
    return <LoadingSpinner />;
  }

  // This page is now designed for mobile first
  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <header className="md:hidden z-10 pt-6 pl-4">
        <button
          onClick={() => router.replace(`/post/${post.id}`)}
          className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {post.title}
        </button>
      </header>

      <div className="min-h-screen px-4 md:px-8 pt-6 pb-8 md:pt-12">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0">
            <div className="relative w-full aspect-[4/5]">
              {post.try_on_image_url && (
                <Image
                  src={post.try_on_image_url}
                  alt={`Try-on result for ${post.title}`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              )}
            </div>
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex items-center justify-end space-x-3 mb-6">
                <button
                  onClick={handleSave}
                  className="bg-[#E7E7E7] text-[#3D5A6C] font-bold md:py-3 md:px-6 py-3 px-4 rounded-xl hover:bg-[#dcdcdc] transition"
                >
                  Save to my Try-Ones
                </button>
                <button
                  onClick={handleShare}
                  className="bg-[#D98B99] text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
                >
                  Share
                </button>
              </div>
              <div className="space-y-4 flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold text-[#3D5A6C] leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-10 h-10 bg-[#A4BBD0] rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">Missland</p>
                    <p className="text-sm text-gray-500">Curated Style</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  {post.colors && post.colors.map((color) => (
                    <span
                      key={color}
                      className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                    >
                      {color}
                    </span>
                  ))}
                  {post.shape && (
                    <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md">
                      {post.shape}
                    </span>
                  )}
                  {post.pattern && (
                    <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md">
                      {post.pattern}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

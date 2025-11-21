"use client";

import { useRouter } from "next/navigation";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import Link from "next/link";
import SaveToCollectionModal from "./SaveToCollectionModal";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface TryOnPostDetailProps {
  post: Post;
  morePosts: Post[];
  onMorePostClick: (post: Post) => Promise<void>;
  onRemove: (postId: number) => Promise<void>;
}

export default function TryOnPostDetail({
  post,
  morePosts,
  onMorePostClick,
  onRemove,
}: TryOnPostDetailProps) {
  const router = useRouter();
  const { showToastWithMessage } = useAuth();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]);

  const handleRemoveClick = async () => {
    await onRemove(post.id);
    // After removing, navigate back to the try-ons grid.
    router.push("/profile/my-try-ons");
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${post.title.replace(/\s+/g, "_")}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToastWithMessage("Image downloaded successfully!");
    } catch {
      showToastWithMessage("Failed to download image. Please try again.");
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          url: shareUrl,
        });
        showToastWithMessage("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToastWithMessage("Link copied to clipboard!");
      }
    } catch {
      showToastWithMessage("Failed to share. Please try again.");
    }
  };

  return (
    <>
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={post}
      />
      <div className="md:px-4 pb-22">
        <header className="md:pt-4">
          <Link
            href="/profile/my-try-ons"
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
            Back to My Try-Ons
          </Link>
        </header>

        {/* --- HIGHLIGHT: REFACTORED LAYOUT TO MATCH SavedPostDetail --- */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* --- LEFT COLUMN: IMAGE --- */}
            <div className="relative w-full aspect-4/5">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* --- RIGHT COLUMN: DETAILS AND ACTIONS --- */}
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex flex-row pb-8 md:pb-16 w-full justify-between">
                <div className="flex flex-row">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2.5 pr-2.5 p-1 transition"
                    aria-label="Share"
                    title="Share this post"
                  >
                    {/* Share Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2 pr-2 p-2 transition"
                    aria-label="Download"
                    title="Download image"
                  >
                    {/* Download Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 grow">
                <h1 className="text-3xl md:text-4xl font-bold text-[#3D5A6C] leading-tight">
                  {post.title}
                </h1>

                {/* --- HIGHLIGHT: BUG FIX - REPLACED .tags WITH STRUCTURED DATA --- */}
                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-gray-700">Details:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.shape && (
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-lg">
                        Shape: {post.shape}
                      </span>
                    )}
                    {post.pattern && (
                      <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-lg">
                        Pattern: {post.pattern}
                      </span>
                    )}
                    {post.size && (
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-lg">
                        Size: {post.size}
                      </span>
                    )}
                  </div>
                  {post.colors && post.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.colors.map((color, index) => (
                        <span
                          key={`${color}-${index}`}
                          className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-lg"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleRemoveClick}
                  className="flex items-center justify-center w-full bg-red-50 text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-red-100 transition"
                  aria-label="Remove from My Try-Ons"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remove from My Try-Ons
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            More Saved Try-Ons
          </h2>
          {morePosts.length > 0 ? (
            <PostGrid
              posts={morePosts}
              variant="saved" // Using 'saved' variant for consistent styling
              onRemove={handleRemoveClick}
              onPostClick={onMorePostClick}
            />
          ) : (
            <p className="text-center text-gray-500">
              No other try-ons in this collection.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

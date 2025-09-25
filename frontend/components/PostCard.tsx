"use client";

import { Post } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostCardProps {
  post: Post;
  variant: "explore" | "saved";
  onSave?: (post: Post) => void;
  onRemove?: (postId: number) => void;
  onPostClick?: (post: Post) => Promise<void>;
  isSaved?: boolean;
}

export default function PostCard({
  post,
  variant,
  onSave,
  onRemove,
  onPostClick,
  isSaved,
}: PostCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCardClick = async () => {
    if (onPostClick) {
      await onPostClick(post);
    }
  };

  const handleTryOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/try-on/${post.id}`);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      await onSave(post);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(post.id);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = post.image_url;
    link.download = `${post.title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMenuOpen(false);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `Check out this style: ${post.title}`,
      text: `I found "${post.title}" on Missland! Check it out.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      alert("Could not share at this time.");
    }
    setIsMenuOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div
      onClick={handleCardClick}
      className="masonry-item group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 block cursor-pointer"
    >
      <Image
        src={post.image_url}
        alt={post.title}
        width={post.width}
        height={post.height}
        className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
      />

      <div
        className={`absolute inset-0 flex flex-col justify-between p-2 md:p-4 transition-opacity duration-300 
          ${
            variant === "explore"
              ? "md:bg-black/40 md:opacity-0 group-hover:opacity-100"
              : ""
          }
          ${
            variant === "saved"
              ? "md:bg-black/40 md:opacity-0 group-hover:opacity-100"
              : ""
          }
        `}
      >
        <div className="flex justify-between items-start">
          <p className="text-white text-sm font-semibold drop-shadow-md">
            {post.title}
          </p>
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-black/50 transition"
              aria-label="Menu"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg z-10">
                <button
                  onClick={handleDownloadClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-t-xl hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-arrow-down mr-2"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleShareClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-b-xl hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-share mr-2"
                    viewBox="0 0 16 16"
                  >
                    <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                  </svg>
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {variant === "explore" && (
            <>
              <button
                onClick={handleTryOnClick}
                className="bg-black/30 text-white font-semibold py-2 px-4 rounded-xl shadow-lg hover:bg-black/50 transition"
              >
                Try On
              </button>
              <button
                onClick={handleSaveClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isSaved
                    ? "bg-[#3D5A6C] text-white"
                    : "bg-black/30 text-white hover:bg-black/50"
                }`}
                aria-label={isSaved ? "Saved" : "Save"}
              >
                <svg
                  className="w-5 h-5"
                  fill={isSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            </>
          )}

          {variant === "saved" && (
            <>
              <div></div>
              <button
                onClick={handleRemoveClick}
                className="self-end bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                aria-label="Remove post"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

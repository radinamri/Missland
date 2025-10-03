"use client";

import { useRouter } from "next/navigation";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import Link from "next/link";
import SaveToCollectionModal from "./SaveToCollectionModal";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface TryOnPostDetailProps {
  post: Post;
  morePosts: Post[];
  onMorePostClick: (post: Post) => Promise<void>;
  onRemove: (postId: number) => Promise<void>;
  onSave?: (post: Post) => void;
  onOpenLoginModal?: () => void;
}

export default function TryOnPostDetail({
  post,
  morePosts,
  onMorePostClick,
  onRemove,
}: TryOnPostDetailProps) {
  const router = useRouter();
  const { collections, showToastWithMessage } = useAuth();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  const handleRemoveClick = async (postId: number) => {
    await onRemove(postId);
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
    } catch (error) {
      console.error("Failed to download image:", error);
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
    } catch (error) {
      console.error("Failed to share:", error);
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
      <header className="md:hidden z-10">
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

      {/* Mobile Layout: Instagram-like, full-width, vertically scrollable */}
      <div className="md:hidden pb-16">
        <div className="w-full mt-2">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="relative w-full min-h-[400px] md:min-h-0 md:aspect-[4/5]">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="100vw"
                priority
              />
            </div>
            <div className="px-4 pt-4 pb-8 bg-white rounded-3xl">
              {/* <div className="flex items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#A4BBD0] rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">Missland</p>
                    <p className="text-sm text-gray-500">Curated Style</p>
                  </div>
                </div>
              </div> */}
              <div className="flex flex-col space-y-2">
                <div className="flex flex-row md:pb-32 pb-8 w-full justify-between">
                  <div className="flex flex-row">
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2 p-1 transition"
                      aria-label="Share"
                      title="Share this post"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 mr-2"
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
                      className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2.5 p-1 transition"
                      aria-label="Download"
                      title="Download image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-8 h-8 mr-2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveClick(post.id)}
                      className="flex items-center justify-center text-red-600 font-bold pl-2.5 p-1 rounded-2xl hover:bg-red-200 transition"
                      aria-label="Remove"
                    >
                      <svg
                        className="w-8 h-8 mr-2"
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
                  </div>
                  <Link
                    href={`/try-on/${post.id}`}
                    className="flex items-center justify-center bg-[#D98B99] text-white text-lg font-bold hover:bg-[#C47C8A] rounded-2xl px-3 py-2 transition"
                    aria-label="Try On"
                    title="Try on this nail design"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                      />
                    </svg>
                    Try On
                  </Link>
                </div>
                {/* <Link
                  href={`/try-on/${post.id}`}
                  className="flex items-center justify-center w-full bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-4 rounded-xl hover:bg-[#dcdcdc] transition"
                  aria-label="Try On"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                    />
                  </svg>
                  Try On
                </Link>
                <button
                  onClick={() => {
                    if (!user && onOpenLoginModal) {
                      onOpenLoginModal();
                    } else {
                      setShowCollectionsModal(true);
                    }
                  }}
                  className={`flex items-center justify-center w-full ${
                    isSaved
                      ? "bg-[#3D5A6C] text-white"
                      : "bg-[#D98B99] text-white"
                  } font-bold py-3 px-4 rounded-xl hover:opacity-90 transition`}
                  aria-label={isSaved ? "Saved" : "Save"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-full bg-[#A4BBD0] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition"
                  aria-label="Share"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                    />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center w-full bg-[#6B7280] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition"
                  aria-label="Download"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => handleRemoveClick(post.id)}
                  className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 transition"
                  aria-label="Remove"
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
                  Remove from Try-Ons
                </button> */}
              </div>
              {/* <h1 className="text-2xl font-bold text-[#3D5A6C] mb-4">
                {post.title}
              </h1> */}
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="py-8">
            <h2 className="text-xl font-bold text-[#3D5A6C] mb-6 text-center">
              More Try-Ons
            </h2>
            <div className="space-y-8">
              {morePosts.map((p) => (
                <div
                  key={p.id}
                  className="w-full cursor-pointer bg-white rounded-3xl shadow-xl overflow-hidden"
                  onClick={() => onMorePostClick(p)}
                >
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={p.image_url}
                      alt={p.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="100vw"
                    />
                  </div>
                  <div className="px-4 pt-4 pb-8 bg-white rounded-3xl">
                    {/* <div className="flex items-center mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#A4BBD0] rounded-full flex items-center justify-center text-white font-bold">
                          M
                        </div>
                        <div>
                          <p className="font-semibold text-[#3D5A6C]">
                            Missland
                          </p>
                          <p className="text-sm text-gray-500">Curated Style</p>
                        </div>
                      </div>
                    </div> */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-row md:pb-32 pb-8 w-full justify-between">
                        <div className="flex flex-row">
                          <button
                            onClick={handleShare}
                            className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2 p-1 transition"
                            aria-label="Share"
                            title="Share this post"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-8 h-8 mr-2"
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
                            className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2.5 p-1 transition"
                            aria-label="Download"
                            title="Download image"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-8 h-8 mr-2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveClick(post.id)}
                            className="flex items-center justify-center text-red-600 font-bold pl-2.5 p-1 rounded-2xl hover:bg-red-200 transition"
                            aria-label="Remove"
                          >
                            <svg
                              className="w-8 h-8 mr-2"
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
                        </div>
                        <Link
                          href={`/try-on/${post.id}`}
                          className="flex items-center justify-center bg-[#D98B99] text-white text-lg font-bold hover:bg-[#C47C8A] rounded-2xl px-3 py-2 transition"
                          aria-label="Try On"
                          title="Try on this nail design"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 mr-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                            />
                          </svg>
                          Try On
                        </Link>
                      </div>
                      {/* <Link
                        href={`/try-on/${p.id}`}
                        className="flex items-center justify-center w-full bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-4 rounded-xl hover:bg-[#dcdcdc] transition"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Try On"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                          />
                        </svg>
                        Try On
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user && onOpenLoginModal) {
                            onOpenLoginModal();
                          } else {
                            setShowCollectionsModal(true);
                          }
                        }}
                        className={`flex items-center justify-center w-full ${
                          isSaved
                            ? "bg-[#3D5A6C] text-white"
                            : "bg-[#D98B99] text-white"
                        } font-bold py-3 px-4 rounded-xl hover:opacity-90 transition`}
                        aria-label={isSaved ? "Saved" : "Save"}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                          />
                        </svg>
                        {isSaved ? "Saved" : "Save"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare();
                        }}
                        className="flex items-center justify-center w-full bg-[#A4BBD0] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition"
                        aria-label="Share"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                          />
                        </svg>
                        Share
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload();
                        }}
                        className="flex items-center justify-center w-full bg-[#6B7280] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition"
                        aria-label="Download"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClick(p.id);
                        }}
                        className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 transition"
                        aria-label="Remove"
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
                        Remove from Try-Ons
                      </button> */}
                    </div>
                    {/* <h1 className="text-2xl font-bold text-[#3D5A6C] mb-4">
                      {p.title}
                    </h1> */}
                    <div className="flex flex-wrap gap-2">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Original design */}
      <div className="hidden md:block container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative w-full min-h-[400px] md:aspect-[4/5]">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="50vw"
                priority
              />
            </div>
            <div className="flex flex-col p-6 md:p-8">
              <div className="flex flex-row md:pb-32 pb-8 w-full justify-between">
                <div className="flex flex-row">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2 p-1 transition"
                    aria-label="Share"
                    title="Share this post"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mr-2"
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
                    className="flex items-center justify-center text-[#3D5A6C] font-bold hover:bg-gray-100 rounded-2xl pl-2.5 p-1 transition"
                    aria-label="Download"
                    title="Download image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mr-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveClick(post.id)}
                    className="flex items-center justify-center text-red-600 font-bold pl-2.5 p-1 rounded-2xl hover:bg-red-200 transition"
                    aria-label="Remove"
                  >
                    <svg
                      className="w-8 h-8 mr-2"
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
                </div>
                <Link
                  href={`/try-on/${post.id}`}
                  className="flex items-center justify-center bg-[#D98B99] text-white text-xl font-bold hover:bg-[#C47C8A] rounded-2xl px-3 py-2 transition"
                  aria-label="Try On"
                  title="Try on this nail design"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                    />
                  </svg>
                  Try On
                </Link>
              </div>
              {/* <div className="flex flex-col space-y-3 mb-6">
                <Link
                  href={`/try-on/${post.id}`}
                  className="flex items-center justify-center w-full bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
                    />
                  </svg>
                  Try On
                </Link>
                <button
                  onClick={() => {
                    if (!user && onOpenLoginModal) {
                      onOpenLoginModal();
                    } else {
                      setShowCollectionsModal(true);
                    }
                  }}
                  className={`flex items-center justify-center w-full ${
                    isSaved
                      ? "bg-[#3D5A6C] text-white"
                      : "bg-[#D98B99] text-white"
                  } font-bold py-3 px-6 rounded-xl hover:opacity-90 transition`}
                  aria-label={isSaved ? "Saved" : "Save"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-full bg-[#A4BBD0] text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
                  aria-label="Share"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                    />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center w-full bg-[#6B7280] text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
                  aria-label="Download"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => handleRemoveClick(post.id)}
                  className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 transition"
                  aria-label="Remove"
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
                  Remove from Try-Ons
                </button>
              </div> */}
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
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 px-4 md:px-8">
          <h2 className="text-2xl font-bold text-[#3D5A6C] mb-6 text-center">
            More Try-Ons
          </h2>
          <PostGrid
            posts={morePosts}
            variant="saved"
            onRemove={onRemove}
            onPostClick={onMorePostClick}
            isSaved={(p) =>
              collections?.some((c) =>
                (c.posts || []).some((cp) => cp.id === p.id)
              ) ?? false
            }
          />
        </div>
      </div>
    </>
  );
}

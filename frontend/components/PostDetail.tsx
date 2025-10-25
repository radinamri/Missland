"use client";

import { useState, useMemo, useEffect } from "react";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import Pagination from "./Pagination";
import { useAuth } from "@/context/AuthContext";
import { useSearchStore } from "@/stores/searchStore";
import Link from "next/link";
import SaveToCollectionModal from "./SaveToCollectionModal";

const MORE_POSTS_PER_PAGE = 24;

interface PostDetailProps {
  post: Post;
  morePosts: Post[];
  onMorePostClick: (post: Post) => Promise<void>;
  onSave: (post: Post) => void;
  onBack: () => void;
  onOpenLoginModal?: () => void;
}

export default function PostDetail({
  post,
  morePosts,
  onMorePostClick,
  onSave,
  onBack,
  onOpenLoginModal,
}: PostDetailProps) {
  const { user, collections, showToastWithMessage } = useAuth();
  const { searchTerm } = useSearchStore();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [morePostsPage, setMorePostsPage] = useState(1);
  const totalMorePostsPages = Math.ceil(morePosts.length / MORE_POSTS_PER_PAGE);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]);

  const isSaved = useMemo(() => {
    if (!user || !collections) return false;
    return collections.some((collection) =>
      (collection.posts || []).some((p) => p.id === post.id)
    );
  }, [collections, post, user]);

  const paginatedMorePosts = useMemo(() => {
    // First, filter by the search term
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? morePosts.filter(
          (p) =>
            p.title.toLowerCase().includes(term) ||
            (p.shape && p.shape.toLowerCase().includes(term)) ||
            (p.pattern && p.pattern.toLowerCase().includes(term)) ||
            (p.colors &&
              p.colors.some((color) => color.toLowerCase().includes(term)))
        )
      : morePosts;

    // Then, slice the filtered array for the current page
    const startIndex = (morePostsPage - 1) * MORE_POSTS_PER_PAGE;
    const endIndex = startIndex + MORE_POSTS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [morePosts, searchTerm, morePostsPage]);

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
      <div className="px-4 md:px-8 pt-6 pb-24 md:pt-12">
        <header className="md:hidden mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors"
            aria-label="Go back"
            title="Back to explore"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Back to explore
          </button>
        </header>

        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="md:hidden">
            <div className="relative w-full aspect-[4/5]">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                style={{ objectFit: "cover" }}
                sizes="100vw"
                priority
              />
            </div>
            <div className="px-4 pt-4 pb-4">
              <div className="flex flex-row pb-8 w-full justify-between">
                <div className="flex flex-row">
                  <button
                    onClick={() => {
                      if (!user && onOpenLoginModal) {
                        onOpenLoginModal();
                      } else {
                        setShowCollectionsModal(true);
                      }
                    }}
                    className="flex items-center justify-center font-bold text-[#3D5A6C] hover:bg-gray-100 rounded-2xl pl-3 p-1 transition"
                    aria-label={isSaved ? "Saved" : "Save"}
                    title={
                      isSaved ? "Saved to collection" : "Save to collection"
                    }
                  >
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
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                  </button>
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
              <div className="space-y-3">
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
          </div>

          {/* Old design - now only for desktop (hidden md:block) */}
          <div className="hidden md:block">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0">
              <div className="relative w-full aspect-[4/5]">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="flex flex-col p-6 md:p-8">
                <div className="flex flex-row md:pb-32 pb-8 w-full justify-between">
                  <div className="flex flex-row">
                    <button
                      onClick={() => {
                        if (!user && onOpenLoginModal) {
                          onOpenLoginModal();
                        } else {
                          setShowCollectionsModal(true);
                        }
                      }}
                      className="flex items-center justify-center font-bold text-[#3D5A6C] hover:bg-gray-100 rounded-2xl pl-3 p-1 transition"
                      aria-label={isSaved ? "Saved" : "Save"}
                      title={
                        isSaved ? "Saved to collection" : "Save to collection"
                      }
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
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                        />
                      </svg>
                    </button>
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
                    {post.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    )) ?? (
                      <p className="text-gray-500 text-sm">No tags available</p>
                    )}
                  </div>
                </div>
              </div>
            </div> */}
            <div className="grid grid-cols-2 gap-0">
              <div className="relative w-full aspect-[4/5]">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="flex flex-col p-8">
                <div className="flex flex-row pb-32 w-full justify-between">
                  <div className="flex flex-row">
                    <button
                      onClick={() => {
                        if (!user && onOpenLoginModal) {
                          onOpenLoginModal();
                        } else {
                          setShowCollectionsModal(true);
                        }
                      }}
                      className="flex items-center justify-center font-bold text-[#3D5A6C] hover:bg-gray-100 rounded-2xl pl-3 p-1 transition"
                      aria-label={isSaved ? "Saved" : "Save"}
                      title={
                        isSaved ? "Saved to collection" : "Save to collection"
                      }
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
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                        />
                      </svg>
                    </button>
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
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            More to explore
          </h2>
          {paginatedMorePosts.length > 0 ? (
            <>
              <PostGrid
                posts={paginatedMorePosts}
                variant="explore"
                onPostClick={onMorePostClick}
                onSave={onSave}
                isSaved={(p) =>
                  collections?.some((c) =>
                    (c.posts || []).some((cp) => cp.id === p.id)
                  ) ?? false
                }
              />
              {/* Add the pagination component if there's more than one page */}
              {totalMorePostsPages > 1 && (
                <Pagination
                  currentPage={morePostsPage}
                  totalPages={totalMorePostsPages}
                  onPageChange={(page) => setMorePostsPage(page)}
                />
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">No more posts available</p>
          )}
        </div>
      </div>
    </>
  );
}

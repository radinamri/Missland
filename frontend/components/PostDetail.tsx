"use client";

import { useState, useMemo } from "react";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import SaveToCollectionModal from "./SaveToCollectionModal";

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
  const { user, collections } = useAuth();

  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  const isSaved = useMemo(() => {
    if (!user || !collections) return false;
    return collections.some((collection) =>
      (collection.posts || []).some((p) => p.id === post.id)
    );
  }, [collections, post, user]);

  // Debugging logs
  console.log("PostDetail props:", { post, morePosts });
  console.log("Post saved status:", isSaved);
  console.log("Collections:", collections);

  return (
    <>
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={post}
      />
      <div className="min-h-screen bg-gray-50 px-4 md:px-8 pt-6 pb-8 md:pt-12">
        <header className="md:hidden mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors"
            aria-label="Go back"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0">
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
              <div className="flex items-center justify-end space-x-3 mb-6">
                <Link
                  href={`/try-on/${post.id}`}
                  className="bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition"
                >
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
                  className={`${
                    isSaved
                      ? "bg-[#3D5A6C] text-white"
                      : "bg-[#D98B99] text-white"
                  } font-bold py-3 px-6 rounded-xl hover:opacity-90 transition`}
                  aria-label={isSaved ? "Saved" : "Save"}
                >
                  {isSaved ? "Saved" : "Save"}
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
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            More to explore
          </h2>
          {morePosts.length > 0 ? (
            <PostGrid
              posts={morePosts}
              variant="explore"
              onPostClick={onMorePostClick}
              onSave={onSave}
              isSaved={(p) =>
                collections?.some((c) =>
                  (c.posts || []).some((cp) => cp.id === p.id)
                ) ?? false
              }
            />
          ) : (
            <p className="text-center text-gray-500">No more posts available</p>
          )}
        </div>
      </div>
    </>
  );
}

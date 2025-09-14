"use client";

import { useRouter } from "next/navigation";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface SavedPostDetailProps {
  post: Post;
  morePosts: Post[];
  onMorePostClick: (post: Post) => Promise<void>;
  onRemove: (postId: number) => void;
  collectionId: string;
}

export default function SavedPostDetail({
  post,
  morePosts,
  onMorePostClick,
  onRemove,
  collectionId,
}: SavedPostDetailProps) {
  const { collections } = useAuth();
  const router = useRouter();

  // Find the collection name based on collectionId
  const collection = collections?.find((c) => c.id === parseInt(collectionId));
  const collectionName = collection?.name || "Collection";

  const handleRemoveClick = (postId: number) => {
    onRemove(postId);
    router.push(`/profile/saved/${collectionId}`);
  };

  return (
    <>
      <header className="md:hidden z-10">
        <Link
          href={`/profile/saved/${collectionId}`}
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
          Back to {collectionName}
        </Link>
      </header>

      {/* Mobile Layout: Instagram-like, full-width, vertically scrollable */}
      <div className="md:hidden">
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#A4BBD0] rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">Missland</p>
                    <p className="text-sm text-gray-500">Curated Style</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveClick(post.id)}
                  className="bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
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
              </div>
              <h1 className="text-2xl font-bold text-[#3D5A6C] mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={`/try-on/${post.id}`}
                className="block w-full bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition text-center"
              >
                Try On
              </Link>
            </div>
          </div>

          <div className="py-8">
            <h2 className="text-xl font-bold text-[#3D5A6C] mb-6 text-center">
              More in this collection
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
                    <div className="flex items-center justify-between mb-4">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClick(p.id);
                        }}
                        className="bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
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
                    </div>
                    <h1 className="text-2xl font-bold text-[#3D5A6C] mb-4">
                      {p.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/try-on/${p.id}`}
                      className="block w-full bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Try On
                    </Link>
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
              <div className="flex items-center justify-end space-x-3 mb-6">
                <Link
                  href={`/try-on/${post.id}`}
                  className="bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition"
                >
                  Try On
                </Link>
                <button
                  onClick={() => handleRemoveClick(post.id)}
                  className="bg-white/80 text-red-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
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
            More in this collection
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

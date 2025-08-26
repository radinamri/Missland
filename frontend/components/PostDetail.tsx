"use client";

import { useState } from "react";
import { Post } from "@/types";
import Image from "next/image";
import PostGrid from "./PostGrid";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SaveToCollectionModal from "./SaveToCollectionModal";

interface PostDetailProps {
  post: Post;
  morePosts: Post[];
  onMorePostClick: (post: Post) => void;
}

export default function PostDetail({
  post,
  morePosts,
  onMorePostClick,
}: PostDetailProps) {
  const { user, trackPostClick } = useAuth();
  const router = useRouter();

  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);

  const openSaveModal = (postToSave: Post) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPostToSave(postToSave);
    setShowCollectionsModal(true);
  };

  const handlePostClick = async (clickedPost: Post) => {
    await trackPostClick(clickedPost.id);
    onMorePostClick(clickedPost);
    router.push(`/post/${clickedPost.id}`, { scroll: false });
  };

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500 animate-pulse">Loading Post...</p>
      </div>
    );
  }

  return (
    <>
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={postToSave}
      />

      <div className="bg-white overflow-y-auto max-h-[90vh]">
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto rounded-xl shadow-lg p-4 md:p-8">
            <div className="w-full">
              <Image
                src={post.image_url}
                alt={post.title}
                width={post.width}
                height={post.height}
                className="w-full h-auto rounded-2xl"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-end mb-6 space-x-3">
                <Link
                  href={`/try-on/${post.id}`}
                  className="bg-gray-100 text-gray-800 font-bold py-3 px-6 rounded-2xl hover:bg-gray-200 transition"
                >
                  Try On
                </Link>
                <button
                  onClick={() => openSaveModal(post)}
                  className="bg-pink-500 text-white font-bold py-3 px-6 rounded-2xl hover:bg-pink-600 transition"
                >
                  Save
                </button>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                    N
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">NANA-AI</p>
                    <p className="text-sm text-gray-500">Curated Style</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags &&
                    post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            More to explore
          </h2>
          <PostGrid
            posts={morePosts}
            variant="explore"
            onSave={openSaveModal}
            onPostClick={handlePostClick}
          />
        </div>
      </div>
    </>
  );
}

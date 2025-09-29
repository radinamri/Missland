"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import SaveToCollectionModal from "@/components/SaveToCollectionModal";
import LoginModal from "@/components/LoginModal";

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  const { user, showToastWithMessage, trackPostClick } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (postId) {
      // Fetch post data
      api
        .get<Post>(`/api/public/posts/${postId}/`)
        .then((response) => setPost(response.data))
        .catch(() => router.push("/")); // Redirect home if post not found
    }
  }, [postId, router]);

  useEffect(() => {
    const pendingIdStr = localStorage.getItem("pendingSavePostId");
    if (
      pendingIdStr &&
      user &&
      post &&
      parseInt(pendingIdStr, 10) === post.id
    ) {
      setShowCollectionsModal(true);
      trackPostClick(post.id).catch(console.error);
      showToastWithMessage("Now saving the post to your collection!");
      localStorage.removeItem("pendingSavePostId");
    }
  }, [user, post, trackPostClick, showToastWithMessage]);

  const handleSaveToCollection = () => {
    if (!user || !post) {
      localStorage.setItem("pendingSavePostId", postId);
      setShowLoginModal(true);
      showToastWithMessage("Please log in to save this post.");
      return;
    }
    setShowCollectionsModal(true);
    trackPostClick(post.id).catch(console.error);
  };

  if (!post) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-8 md:pt-12">
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={post}
      />
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0">
          <div className="relative w-full aspect-[4/5]">
            <Image
              src={post.try_on_image_url}
              alt={`Try-on result for ${post.title}`}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="flex flex-col p-6 md:p-8">
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
            <div className="flex flex-col items-center justify-center space-y-2 mt-16">
              <Link
                href={`/try-on/${post.id}`}
                className="w-full text-center bg-[#3D5A6C] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#314A5A] transition"
              >
                Try On Yourself
              </Link>
              <button
                onClick={handleSaveToCollection}
                className="w-full text-center bg-[#D98B99] text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
              >
                Save to Collection
              </button>
              <Link
                href="/"
                className="w-full text-center bg-[#E7E7E7] text-[#3D5A6C] font-bold py-3 px-6 rounded-xl hover:bg-[#dcdcdc] transition"
              >
                Explore More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
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
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [hasInteractedOrPopupShown, setHasInteractedOrPopupShown] =
    useState(false);

  useEffect(() => {
    if (postId) {
      api
        .get<Post>(`/api/public/posts/${postId}/`)
        .then((response) => setPost(response.data))
        .catch(() => router.push("/"));
    }
    window.scrollTo(0, 0);
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

  useEffect(() => {
    // Only run the timer if the user is not logged in, the post is loaded,
    // AND there has been no previous interaction or popup shown.
    if (!user && post && !hasInteractedOrPopupShown) {
      const id = setTimeout(() => {
        setShowLoginModal(true);
        setHasInteractedOrPopupShown(true); // Set the flag to true so this never runs again.
      }, 5000);
      timeoutId.current = id;
    }

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
    // The dependency array is simplified to use the new flag.
  }, [user, post, hasInteractedOrPopupShown]);

  const handleSaveToCollection = () => {
    if (!user || !post) {
      localStorage.setItem("pendingSavePostId", postId);
      setShowLoginModal(true);
      showToastWithMessage("Please log in to save this post.");
      if (timeoutId.current) clearTimeout(timeoutId.current);
      return;
    }
    setShowCollectionsModal(true);
    trackPostClick(post.id).catch(console.error);
    if (timeoutId.current) clearTimeout(timeoutId.current);
  };

  const handleInteraction = () => {
    // If the user interacts with the page in any way, clear the timer...
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    // ...and set the flag to true, permanently disabling the auto-popup.
    setHasInteractedOrPopupShown(true);
  };

  if (!post) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="px-4 md:px-8 pt-6 pb-24 md:pt-22"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative w-full aspect-[4/5]">
            <Image
              src={post.try_on_image_url || post.image_url}
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

            <div className="flex flex-col items-center justify-center space-y-2 mt-8 md:mt-16">
              <Link
                href={`/try-on/${post.id}`}
                className="w-full text-center bg-[#3D5A6C] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#314A5A] transition"
                onClick={handleInteraction}
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
                onClick={handleInteraction}
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

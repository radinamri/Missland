"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CollectionDetail, Post } from "@/types";
import api from "@/utils/api";
import PostGrid from "@/components/PostGrid";
import Link from "next/link";
import SaveToCollectionModal from "@/components/SaveToCollectionModal";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CollectionDetailPage() {
  const {
    user,
    isLoading: isAuthLoading,
    tokens,
    managePostInCollection,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);

  const fetchCollectionData = useCallback(async () => {
    if (user && collectionId) {
      try {
        const response = await api.get<CollectionDetail>(
          `/api/auth/collections/${collectionId}/`
        );
        setCollection(response.data);
      } catch (error) {
        console.error("Failed to fetch collection details", error);
      }
    }
  }, [user, collectionId]);

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchCollectionData().finally(() => setIsLoading(false));
  }, [fetchCollectionData]);

  const openSaveModal = (post: Post) => {
    setPostToSave(post);
    setShowCollectionsModal(true);
  };

  const handleRemovePost = async (postId: number) => {
    if (!collectionId) return;

    const message = await managePostInCollection(Number(collectionId), postId);
    if (message) {
      showToastWithMessage(message);
      fetchCollectionData();
    }
  };

  const handlePostClick = async (post: Post) => {
    router.push(`/profile/saved/${collectionId}/${post.id}`);
  };

  if (isLoading || isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-8">
        <header className="space-y-4">
          <Link
            href="/profile/saved"
            className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors lg:hidden"
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
              ></path>
            </svg>
            Back to Collections
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[#3D5A6C]">
            {collection?.name}
          </h1>
        </header>
      </div>

      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={postToSave}
      />

      {collection && collection.posts.length > 0 ? (
        <PostGrid
          posts={collection.posts}
          variant="saved"
          onSave={openSaveModal}
          onRemove={handleRemovePost}
          onPostClick={handlePostClick}
        />
      ) : (
        <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm mt-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#3D5A6C] mb-2">
            No Posts in This Collection
          </h2>
          <p className="text-gray-500 mb-6">
            Start adding posts from the Explore page to see them here.
          </p>
          <Link
            href="/"
            className="bg-[#D98B99] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#C47C8A] transition"
          >
            Go to Explore
          </Link>
        </div>
      )}
    </div>
  );
}

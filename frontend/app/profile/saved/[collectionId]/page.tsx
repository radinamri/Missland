"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CollectionDetail, Post } from "@/types";
import api from "@/utils/api";
import PostGrid from "@/components/PostGrid";
import Link from "next/link";
import SaveToCollectionModal from "@/components/SaveToCollectionModal";
import LoadingSpinner from "@/components/LoadingSpinner";

// This is now a single, self-contained client component
export default function CollectionDetailPage() {
  const {
    user,
    isLoading: isAuthLoading,
    tokens,
    managePostInCollection,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();

  // We use the 'useParams' hook to safely get the ID on the client side
  const params = useParams();
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [postToSave, setPostToSave] = useState<Post | null>(null);

  const fetchCollectionData = async () => {
    // We check for user and collectionId before fetching
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
  };

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchCollectionData().finally(() => setIsLoading(false));
  }, [user, collectionId]);

  const openSaveModal = (post: Post) => {
    setPostToSave(post);
    setShowCollectionsModal(true);
  };

  const handleRemovePost = async (postId: number) => {
    if (!collectionId) return;

    const message = await managePostInCollection(Number(collectionId), postId);
    if (message) {
      showToastWithMessage(message);
      // Refresh the data to show the post has been removed
      fetchCollectionData();
    }
  };

  if (isLoading || isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SaveToCollectionModal
        isOpen={showCollectionsModal}
        onClose={() => setShowCollectionsModal(false)}
        postToSave={postToSave}
      />
      <div className="bg-gray-50 md:shadow-lg p-4 md:p-8 min-h-screen">
        <header className="mb-8">
          <Link
            href="/profile/saved"
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 mb-2 block"
          >
            &larr; Back to Collections
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {collection?.name}
          </h1>
        </header>

        {collection && collection.posts.length > 0 ? (
          <PostGrid
            posts={collection.posts}
            variant="saved"
            onSave={openSaveModal}
            onRemove={handleRemovePost}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Posts in This Collection
            </h2>
            <p className="text-gray-500">
              Start adding posts from the Explore page.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

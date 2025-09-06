"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { TryOn } from "@/types";
import api from "@/utils/api";
import PostGrid from "@/components/PostGrid";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MyTryOnsPage() {
  // 1. Get the new functions from the context
  const {
    user,
    tokens,
    isLoading: isAuthLoading,
    deleteTryOn,
    showToastWithMessage,
  } = useAuth();
  const router = useRouter();
  const [tryOns, setTryOns] = useState<TryOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Create a memoized function to fetch data
  const fetchTryOns = useCallback(async () => {
    if (user) {
      try {
        const response = await api.get<TryOn[]>(
          "/api/auth/profile/my-try-ons/"
        );
        setTryOns(response.data);
      } catch (error) {
        console.error("Failed to fetch try-ons:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchTryOns().finally(() => setIsLoading(false));
  }, [fetchTryOns]);

  // 3. Create the remove handler
  const handleRemoveTryOn = async (postIdToRemove: number) => {
    // Find the specific TryOn object that contains the post to be removed
    const tryOnToRemove = tryOns.find(
      (tryOn) => tryOn.post.id === postIdToRemove
    );
    if (!tryOnToRemove) return;

    const message = await deleteTryOn(tryOnToRemove.id);
    if (message) {
      showToastWithMessage(message);
      // Refresh the list after deleting
      fetchTryOns();
    }
  };

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner />;
  }

  const posts = tryOns.map((tryOn) => tryOn.post);

  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
      <header className="mb-8">
        <Link
          href="/profile"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 mb-2 block"
        >
          &larr; Back to Profile
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          My Try-Ons
        </h1>
      </header>
      {posts.length > 0 ? (
        <PostGrid
          posts={posts}
          variant="saved"
          // 4. Pass the remove handler to the grid
          onRemove={handleRemoveTryOn}
        />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Saved Try-Ons
          </h2>
          <p className="text-gray-500">
            Styles you save from a try-on session will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

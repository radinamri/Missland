// app/profile/my-try-ons/page.tsx
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

  const handleRemoveTryOn = async (postIdToRemove: number) => {
    const tryOnToRemove = tryOns.find(
      (tryOn) => tryOn.post.id === postIdToRemove
    );
    if (!tryOnToRemove) return;

    const message = await deleteTryOn(tryOnToRemove.id);
    if (message) {
      showToastWithMessage(message);
      fetchTryOns();
    }
  };

  const handlePostClick = async (post: TryOn["post"]) => {
    router.push(`/profile/my-try-ons/${post.id}`);
  };

  if (isAuthLoading || isLoading) {
    return <LoadingSpinner />;
  }

  const posts = tryOns.map((tryOn) => tryOn.post);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/profile"
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
            />
          </svg>
          Back to Profile
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-[#3D5A6C]">
          My Try-Ons
        </h1>
      </header>
      {posts.length > 0 ? (
        <PostGrid
          posts={posts}
          variant="saved"
          onRemove={handleRemoveTryOn}
          onPostClick={handlePostClick}
        />
      ) : (
        <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm">
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
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#3D5A6C] mb-2">
            No Saved Try-Ons
          </h2>
          <p className="text-gray-500 mb-6">
            Find a style you love and give it a virtual try-on!
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

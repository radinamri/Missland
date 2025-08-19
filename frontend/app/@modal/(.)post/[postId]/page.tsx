"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import PostDetail from "@/components/PostDetail";
import { useNavigation } from "@/context/NavigationContext";

export default function PostModal() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { currentView, handleGoBack, handlePostClick } = useNavigation();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleClose() {
    handleGoBack(); // 3. Pop from our navigation stack
    router.back();
  }

  // 4. Check if the current view is a detail view
  if (currentView?.type !== "detail" || !currentView.parentPost) {
    // This can happen briefly during transitions, render nothing or a loader
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="bg-transparent p-4 backdrop:bg-black/50"
    >
      <div className="relative max-w-5xl w-screen bg-white rounded-2xl shadow-xl animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-200/50 hover:bg-gray-300/70 rounded-full flex items-center justify-center z-10"
          aria-label="Close post"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
        <PostDetail
          post={currentView.parentPost}
          morePosts={currentView.posts}
          onMorePostClick={handlePostClick}
        />
      </div>
    </dialog>
  );
}

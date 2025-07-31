"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import PostDetail from "@/components/PostDetail";

export default function PostModal() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    router.back();
  };

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
        <PostDetail postId={postId} />
      </div>
    </dialog>
  );
}

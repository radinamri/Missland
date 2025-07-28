"use client";

import { Post } from "@/types";
import Image from "next/image";

interface PostCardProps {
  post: Post;
  variant: "explore" | "saved"; // Determines which buttons to show
  onSave?: (postId: number) => void;
  onRemove?: (postId: number) => void;
}

export default function PostCard({
  post,
  variant,
  onSave,
  onRemove,
}: PostCardProps) {
  return (
    <div className="masonry-item group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Image
        src={post.image_url}
        alt={post.title}
        width={post.width}
        height={post.height}
        className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
      />

      {/* Overlay for actions */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-2 md:p-4 transition-opacity duration-300 
        ${
          variant === "explore"
            ? "md:bg-black/40 md:opacity-0 group-hover:opacity-100"
            : ""
        }
        ${
          variant === "saved"
            ? "md:bg-black/40 md:opacity-0 group-hover:opacity-100"
            : ""
        }
      `}
      >
        <p className="text-white text-sm font-semibold drop-shadow-md">
          {post.title}
        </p>

        <div className="flex items-center justify-between">
          {/* Conditionally render buttons based on the variant */}
          {variant === "explore" && onSave && (
            <>
              <button className="bg-white text-gray-800 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-pink-100 transition-transform hover:scale-105">
                Try On
              </button>
              <button
                onClick={() => onSave(post.id)}
                className="bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-transform hover:scale-105"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4zM5 9a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2H5z"></path>
                </svg>
              </button>
            </>
          )}

          {variant === "saved" && onRemove && (
            <>
              <div></div>{" "}
              {/* Empty div to push the remove button to the right */}
              <button
                onClick={() => onRemove(post.id)}
                className="self-end bg-white/80 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-transform hover:scale-110"
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
                  ></path>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Post } from "@/types";
import Image from "next/image";

interface PostCardProps {
  post: Post;
  onSaveClick: (postId: number) => void;
}

export default function PostCard({ post, onSaveClick }: PostCardProps) {
  return (
    <div className="masonry-item group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Image
        src={post.image_url}
        alt={post.title}
        width={post.width}
        height={post.height}
        className="w-full h-auto block"
      />
      <div className="absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 md:bg-black/40 md:opacity-0 group-hover:opacity-100">
        <div>
          <p className="text-white text-sm font-semibold drop-shadow-md">
            {post.title}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button className="bg-white text-gray-800 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-pink-100 transition-transform hover:scale-105">
            Try On
          </button>
          <button
            onClick={() => onSaveClick(post.id)}
            className="bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4zM5 9a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2H5z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

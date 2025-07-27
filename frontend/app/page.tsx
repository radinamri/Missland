"use client";

import { useEffect, useState } from "react";
import { Post } from "@/types";
import api from "@/utils/api";

// A reusable component for each post in the grid
const PostCard = ({ post }: { post: Post }) => {
  return (
    <div className="masonry-item group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img
        src={post.image_url}
        alt={post.title}
        width={post.width}
        height={post.height}
        className="w-full h-auto block"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = `https://placehold.co/${post.width}x${post.height}/fecaca/991b1b?text=Error`;
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100">
        <div>
          <p className="text-white text-sm font-semibold drop-shadow-md">
            {post.title}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button className="bg-white text-gray-800 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-pink-100 transition-transform hover:scale-105">
            Try On
          </button>
          <button className="bg-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-transform hover:scale-105">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V4zM5 9a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2H5z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get<Post[]>("/api/auth/posts/");
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8">
      <style jsx global>{`
        .masonry-grid {
          column-count: 2;
          column-gap: 1rem;
        }
        @media (min-width: 768px) {
          .masonry-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 4;
          }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1rem;
        }
      `}</style>

      <header className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search nails, hair styles..."
            className="w-full bg-gray-100 border border-gray-300 rounded-full py-3 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
          />
          <svg
            className="w-6 h-6 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
      </header>

      {isLoading ? (
        <p className="text-center text-gray-500">Loading styles...</p>
      ) : (
        <div className="masonry-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

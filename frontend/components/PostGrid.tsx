"use client";

import { Post } from "@/types";
import PostCard from "./PostCard";

interface PostGridProps {
  posts: Post[];
  variant: "explore" | "saved";
  onSave?: (post: Post) => void;
  onRemove?: (postId: number) => void;
  onPostClick?: (post: Post) => Promise<void>;
}

export default function PostGrid({
  posts,
  variant,
  onSave,
  onRemove,
  onPostClick,
}: PostGridProps) {
  return (
    <>
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
      <div className="masonry-grid">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            variant={variant}
            onSave={onSave}
            onRemove={onRemove}
            onPostClick={onPostClick}
          />
        ))}
      </div>
    </>
  );
}

"use client";

import { Post } from "@/types";
import PostCard from "./PostCard";
import { useRouter } from "next/navigation";

interface PostGridProps {
  posts: Post[];
  variant: "explore" | "saved";
  onSave?: (post: Post) => void;
  onRemove?: (postId: number) => void;
  onPostClick?: (post: Post) => Promise<void>;
  isSaved?: (post: Post) => boolean;
}

export default function PostGrid({
  posts,
  variant,
  onSave,
  onRemove,
  onPostClick,
  isSaved,
}: PostGridProps) {
  const router = useRouter();

  const handlePostClick = async (post: Post) => {
    if (onPostClick) {
      await onPostClick(post);
    } else if (variant === "saved") {
      // Navigate to saved post detail page
      const collectionId = window.location.pathname.split("/")[3]; // Extract collectionId from URL
      router.push(`/profile/saved/${collectionId}/${post.id}`);
    } else {
      router.push(`/post/${post.id}`);
    }
  };

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
            column-count: 5;
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
            onPostClick={handlePostClick}
            isSaved={isSaved ? isSaved(post) : undefined}
          />
        ))}
      </div>
    </>
  );
}

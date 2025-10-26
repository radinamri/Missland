// components/PostGridSkeleton.tsx

import PostSkeleton from "./PostSkeleton";

interface PostGridSkeletonProps {
  count?: number;
}

export default function PostGridSkeleton({
  count = 10,
}: PostGridSkeletonProps) {
  return (
    <div className="masonry-grid mt-8">
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}

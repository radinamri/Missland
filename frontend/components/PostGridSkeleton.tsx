// components/PostGridSkeleton.tsx

import PostSkeleton from "./PostSkeleton";

interface PostGridSkeletonProps {
  count?: number;
}

/**
 * Skeleton grid that matches the masonry layout for seamless loading.
 * Clean, minimal design with dynamic count based on column configuration.
 */
export default function PostGridSkeleton({
  count = 24,
}: PostGridSkeletonProps) {
  return (
    <>
      <style jsx global>{`
        .skeleton-grid {
          column-count: 2;
          column-gap: 0.75rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .skeleton-grid {
            column-count: 3;
          }
        }
        @media (min-width: 1024px) {
          .skeleton-grid {
            column-count: 4;
          }
        }
        @media (min-width: 1280px) {
          .skeleton-grid {
            column-count: 5;
          }
        }
        .skeleton-grid-item {
          break-inside: avoid;
          margin-bottom: 0.75rem;
          display: inline-block;
          width: 100%;
        }
      `}</style>
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, index) => (
          <div key={`skeleton-${index}`} className="skeleton-grid-item">
            <PostSkeleton delay={index * 15} />
          </div>
        ))}
      </div>
    </>
  );
}

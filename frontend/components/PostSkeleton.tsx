// components/PostSkeleton.tsx

interface PostSkeletonProps {
  delay?: number;
}

/**
 * Clean, minimal skeleton loader matching real nail art image dimensions.
 * Uses Pinterest-style varied heights for natural loading appearance.
 */
export default function PostSkeleton({ delay = 0 }: PostSkeletonProps) {
  // Generate varied heights similar to PostCard randomization
  // Range: 200px to 400px for nail art images
  const heights = [200, 240, 280, 320, 360, 400];
  const randomHeight = heights[Math.floor(Math.random() * heights.length)];

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .skeleton-wrapper {
          animation: fadeIn 0.4s ease-out forwards;
          animation-delay: ${delay}ms;
          opacity: 0;
        }
        .skeleton-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="skeleton-wrapper w-full">
        <div
          className="relative w-full bg-gray-200 rounded-2xl overflow-hidden skeleton-pulse"
          style={{
            height: `${randomHeight}px`,
          }}
        >
          {/* Minimal design - just the background pulse, no shimmer */}
        </div>
      </div>
    </>
  );
}

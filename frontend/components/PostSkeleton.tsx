// components/PostSkeleton.tsx

export default function PostSkeleton() {
  return (
    <div className="masonry-item">
      <div className="relative w-full bg-gray-200 rounded-2xl animate-pulse">
        {/* This empty div will create a random aspect ratio, just like real posts */}
        <div style={{ paddingTop: `${120 + Math.random() * 40}%` }} />
      </div>
    </div>
  );
}

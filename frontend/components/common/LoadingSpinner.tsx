export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#3D5A6C]"></div>
    </div>
  );
}

// Compact spinner for mobile/bottom loader
export function SmallLoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-4" role="status" aria-live="polite">
      <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-[#3D5A6C]"></div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

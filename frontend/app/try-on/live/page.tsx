"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LiveTryOnCamera from "@/components/LiveTryOnCamera";
import TryOnUploader from "@/components/TryOnUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import api from "@/utils/api";

function LiveTryOnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToastWithMessage } = useAuth();
  
  const postId = searchParams.get("postId");
  const [mode, setMode] = useState<"explore" | "upload">(
    postId ? "explore" : "upload"
  );
  const [nailReferenceUrl, setNailReferenceUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!postId);

  useEffect(() => {
    if (postId) {
      // Fetch post data for nail reference
      api
        .get(`/api/auth/posts/${postId}/`)
        .then((response) => {
          setNailReferenceUrl(response.data.image_url);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch post:", error);
          showToastWithMessage("Failed to load nail reference");
          router.push("/");
        });
    }
  }, [postId, router, showToastWithMessage]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === "explore" && nailReferenceUrl ? (
        <LiveTryOnCamera
          nailReferenceUrl={nailReferenceUrl}
          nailPostId={postId ? parseInt(postId) : undefined}
          onBack={() => router.back()}
        />
      ) : (
        <TryOnUploader
          onComplete={(referenceUrl) => {
            setNailReferenceUrl(referenceUrl);
            setMode("explore");
          }}
          onBack={() => router.back()}
        />
      )}
    </div>
  );
}

export default function LiveTryOnPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LiveTryOnContent />
    </Suspense>
  );
}

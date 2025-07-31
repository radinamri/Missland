"use client";

import { useParams } from "next/navigation";
import PostDetail from "@/components/PostDetail";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;

  // This page now only renders the PostDetail component.
  // The main layout, including the single header, is handled by RootLayout.
  return <PostDetail postId={postId} />;
}

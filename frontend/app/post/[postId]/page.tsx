"use client";

import { useParams } from "next/navigation";
import PostDetail from "@/components/PostDetail";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;

  // This page simply renders the PostDetail component.
  // The main layout, including the header, is handled by RootLayout.
  return <PostDetail postId={postId} />;
}

import PostDetail from "@/components/PostDetail";
import { Post, PaginatedPostResponse } from "@/types";
import api from "@/utils/api";
import { notFound } from "next/navigation";

async function getPostData(postId: string) {
  try {
    const postPromise = api.get<Post>(`/api/auth/posts/${postId}/`);
    const morePostsPromise = api.get<PaginatedPostResponse>(
      `/api/auth/posts/${postId}/more/`
    );

    const [postResponse, morePostsResponse] = await Promise.all([
      postPromise,
      morePostsPromise,
    ]);

    return {
      post: postResponse.data,
      morePosts: morePostsResponse.data.results,
    };
  } catch (error) {
    console.error("Failed to fetch post data for full page", error);
    return null;
  }
}

export default async function PostPage({
  params,
}: {
  params: { postId: string };
}) {
  const data = await getPostData(params.postId);

  if (!data) {
    notFound();
  }

  return (
    <PostDetail
      post={data.post}
      morePosts={data.morePosts}
      onMorePostClick={async (post: Post) => {
        window.location.href = `/post/${post.id}`;
      }}
      onSave={(post: Post) => {
        console.log("Save post:", post.id);
      }}
      onBack={() => {
        window.history.back();
      }}
    />
  );
}

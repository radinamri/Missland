import { Post } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Fetch data on the server
async function getPost(postId: string): Promise<Post | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/posts/${postId}/`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function SharePage({
  params,
}: {
  params: { postId: string };
}) {
  const post = await getPost(params.postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>

        <div className="rounded-xl overflow-hidden mb-6 aspect-w-1 aspect-h-1">
          <Image
            src={post.try_on_image_url}
            alt={`Try-on result for ${post.title}`}
            width={500}
            height={500}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            href={`/try-on/${post.id}`}
            className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg hover:bg-pink-600 transition"
          >
            Try On Yourself
          </Link>
          <Link
            href="/login"
            className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition"
          >
            Login or Sign Up
          </Link>
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ArticleDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  thumbnail_url: string;
  published_date: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api
        .get<ArticleDetail>(`/api/auth/articles/${slug}/`)
        .then((response) => setArticle(response.data))
        .catch((error) => console.error("Failed to fetch article", error))
        .finally(() => setIsLoading(false));
    }
  }, [slug]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return (
      <main className="p-4 md:p-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-red-600">Article Not Found</h2>
          <p className="text-gray-500 mt-2">
            The article you are looking for does not exist.
          </p>
          <Link
            href="/articles"
            className="mt-6 inline-block bg-[#3D5A6C] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#314A5A] transition"
          >
            Back to Articles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/articles"
              className="inline-flex items-center text-[#D98B99] hover:text-[#C47C8A] font-semibold transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to all articles
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3D5A6C] mb-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-gray-500 mb-8">
            Published on{" "}
            {new Date(article.published_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-lg">
            <Image
              src={article.thumbnail_url}
              alt={article.title}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* This styling improves readability of the article content */}
          <div className="prose lg:prose-xl max-w-none text-gray-800 leading-relaxed">
            <p>{article.content}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

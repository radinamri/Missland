"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/api";

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
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading article...
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-red-500">Article not found.</p>
      </div>
    );
  }

  return (
    // This outer div now matches the style of the main articles page container
    <div className="bg-white md:shadow-lg p-4 md:p-10">
      {/* This inner div keeps the article content perfectly centered and sized. */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center text-pink-500 hover:underline font-semibold transition-colors"
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
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>
        <p className="text-gray-500 mb-6">
          Published on{" "}
          {new Date(article.published_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-inner">
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            style={{ objectFit: "cover" }}
            priority // Ensures the main image loads quickly
          />
        </div>

        <div className="prose lg:prose-lg max-w-none text-gray-800">
          <p>{article.content}</p>
        </div>
      </div>
    </div>
  );
}

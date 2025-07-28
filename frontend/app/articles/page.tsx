"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

interface Article {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<Article[]>("/api/auth/articles/")
      .then((response) => setArticles(response.data))
      .catch((error) => console.error("Failed to fetch articles", error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading articles...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Our Articles
        </h1>
        <p className="text-lg text-gray-500 mt-2">
          Tips, trends, and inspiration for your next look.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <Link
            href={`/articles/${article.slug}`}
            key={article.id}
            className="group block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            <div className="relative w-full aspect-video">
              <Image
                src={article.thumbnail_url}
                alt={article.title}
                fill
                style={{ objectFit: "cover" }}
                className="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 group-hover:text-pink-500 transition-colors">
                {article.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

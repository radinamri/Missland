"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";
import LoadingSpinner from "@/components/LoadingSpinner";

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
    return <LoadingSpinner />;
  }

  return (
    <main className="p-4 md:p-8">
      <div className="container mx-auto">
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3D5A6C]">
            Our Articles
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            Tips, trends, and inspiration for your next look.
          </p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                href={`/articles/${article.slug}`}
                key={article.id}
                className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.thumbnail_url}
                    alt={article.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#3D5A6C] group-hover:text-[#D98B99] transition-colors duration-300">
                    {article.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Articles Yet
            </h2>
            <p className="text-gray-500">
              We&apos;re working on new content. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

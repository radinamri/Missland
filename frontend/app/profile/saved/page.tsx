"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function SavedPostsPage() {
  const {
    user,
    tokens,
    isLoading: isAuthLoading,
    collections,
    fetchCollections,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !tokens) {
      router.push("/login");
    }
  }, [tokens, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      // Fetch collections when the user is available
      fetchCollections();
    }
  }, [user, fetchCollections]);

  if (isAuthLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white md:shadow-lg p-4 md:p-8 min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          My Collections
        </h1>
      </header>

      {collections.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((collection) => (
            <Link
              href={`/profile/saved/${collection.id}`}
              key={collection.id}
              className="group aspect-square block bg-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden relative"
            >
              {collection.thumbnail_url && (
                <Image
                  src={collection.thumbnail_url}
                  alt={collection.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <h2 className="font-bold text-lg">{collection.name}</h2>
                <p className="text-sm">{collection.post_count} posts</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Collections Yet
          </h2>
          <p className="text-gray-500">
            Posts you save will appear in collections here.
          </p>
        </div>
      )}
    </div>
  );
}

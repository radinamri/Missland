"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/types";
import api from "@/utils/api";
import Image from "next/image";
import { Camera, Upload, Sparkles } from "lucide-react";

export default function TryOnMainPage() {
  const router = useRouter();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch some recent/popular posts for quick browsing
    const fetchRecentPosts = async () => {
      try {
        const response = await api.get<{ results: Post[] }>(
          "/api/auth/posts/filter/?page=1&page_size=12"
        );
        setRecentPosts(response.data.results);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  const handleLiveTryOn = () => {
    router.push("/try-on/live");
  };

  const handleBrowseAll = () => {
    router.push("/");
  };

  const handlePostClick = (postId: number) => {
    router.push(`/try-on/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Try-On Studio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how different nail designs look on you before committing. Upload
            your hand photo or try live with your camera!
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          {/* Live Try-On Card */}
          <button
            onClick={handleLiveTryOn}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <Camera className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Live Try-On</h2>
              <p className="text-white/90">
                Use your camera to see designs in real-time on your hands
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Upload Photo Card */}
          <button
            onClick={() => {
              // For now, redirect to browse - can implement upload later
              router.push("/");
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <Upload className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Browse Designs</h2>
              <p className="text-white/90">
                Explore our collection and select a design to try on
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Quick Browse Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                Quick Browse
              </h2>
            </div>
            <button
              onClick={handleBrowseAll}
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              View All →
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="aspect-[4/5] relative">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-sm font-semibold line-clamp-2">
                        {post.title}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Choose a Design</h3>
              <p className="text-gray-600">
                Browse our collection of nail designs or use the search to find
                your perfect style
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Try It On</h3>
              <p className="text-gray-600">
                Use live camera or upload a photo to see how the design looks on
                your hands
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Save & Share</h3>
              <p className="text-gray-600">
                Save your favorite looks and share them with friends or your nail
                technician
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

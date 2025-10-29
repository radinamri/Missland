"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Search, Users, Camera } from "lucide-react";

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 pt-24 md:pt-0 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-100/60 to-transparent rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/60 to-transparent rounded-full blur-3xl"
            style={{ transform: `translateY(${-scrollY * 0.1}px)` }}
          />
          <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-gradient-to-br from-purple-50/40 to-transparent rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 md:space-y-10">
          {/* Badge */}
          <div className="inline-block">
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200/50 backdrop-blur-sm">
              <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#D98B99] to-blue-600">
                ✨ Welcome to Missland
              </p>
            </div>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#3D5A6C] leading-tight">
              Try nails before you
              <span className="block bg-gradient-to-r from-[#D98B99] via-pink-500 to-purple-500 text-transparent bg-clip-text">
                commit
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              See how any nail design looks on your hands in real-time. Explore
              thousands of curated styles, discover trends, and connect with
              talented artists.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/try-on"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D98B99] to-pink-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-pink-300/40 transition-all duration-300 gap-2 group"
            >
              Try Now{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-[#3D5A6C] font-semibold rounded-xl hover:border-[#D98B99] hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 transition-all duration-300"
            >
              Explore Gallery
            </Link>
          </div>

          {/* Stats row */}
          <div className="pt-12 grid grid-cols-3 gap-8 md:gap-12">
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D98B99] to-pink-500">
                10K+
              </p>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Designs
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-[#3D5A6C]">
                Real-Time
              </p>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                AR Try-On
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                AI-Powered
              </p>
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Search
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-[#D98B99]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 relative overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-4 mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D5A6C]">
              Why choose Missland
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
              Everything you need to discover, try, and share beautiful nail
              designs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group p-8 md:p-10 rounded-2xl border-2 border-pink-200/60 bg-gradient-to-br from-pink-50/80 to-rose-50/80 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-200/40 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-pink-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Camera className="w-7 h-7 text-[#D98B99]" />
                </div>
                <h3 className="text-2xl font-bold text-[#3D5A6C]">
                  Virtual Try-On
                </h3>
                <p className="text-gray-700 font-light leading-relaxed">
                  Point your camera at your hands and see any nail design in
                  real-time with our advanced AR technology.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 md:p-10 rounded-2xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/40 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#3D5A6C]">
                  10,000+ Designs
                </h3>
                <p className="text-gray-700 font-light leading-relaxed">
                  Curated collection from real artists and trending styles.
                  Browse, search by image, or let AI find your match.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 md:p-10 rounded-2xl border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-pink-50/80 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-200/40 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Search className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#3D5A6C]">
                  AI Discovery
                </h3>
                <p className="text-gray-700 font-light leading-relaxed">
                  Search by color, style, or upload a photo. Our intelligent AI
                  understands your aesthetic instantly.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 md:p-10 rounded-2xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/80 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-200/40 transition-all duration-300 cursor-pointer backdrop-blur-sm">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Users className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#3D5A6C]">
                  Artist Community
                </h3>
                <p className="text-gray-700 font-light leading-relaxed">
                  Discover talented artists, view portfolios, read reviews, and
                  book consultations directly with them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 relative bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D5A6C]">
              How it works
            </h2>
            <p className="text-gray-600 text-lg font-light">
              Simple steps to find your perfect nails
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center group">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 border-2 border-pink-200 flex items-center justify-center font-bold text-xl text-[#D98B99] shadow-md">
                  1
                </div>
              </div>
              <div className="flex-1 space-y-2 md:space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-[#3D5A6C]">
                  Browse or search
                </h3>
                <p className="text-gray-600 font-light text-lg leading-relaxed">
                  Explore our curated collection or upload a photo to find
                  similar nail designs instantly. Use filters, colors, or let
                  our AI find what matches your style.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center group">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 flex items-center justify-center font-bold text-xl text-blue-600 shadow-md">
                  2
                </div>
              </div>
              <div className="flex-1 space-y-2 md:space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-[#3D5A6C]">
                  Try it on instantly
                </h3>
                <p className="text-gray-600 font-light text-lg leading-relaxed">
                  Use your camera to see exactly how the design looks on your
                  hands in real-time. No appointments needed—just confidence.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center group">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 flex items-center justify-center font-bold text-xl text-purple-600 shadow-md">
                  3
                </div>
              </div>
              <div className="flex-1 space-y-2 md:space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-[#3D5A6C]">
                  Connect or book
                </h3>
                <p className="text-gray-600 font-light text-lg leading-relaxed">
                  Save to your collection, share with friends, or connect
                  directly with the artist. Find your next nail artist based on
                  their work and ratings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 px-4 md:px-8 relative overflow-hidden bg-white">
        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-8 md:space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D5A6C] leading-tight">
              Ready to find your
              <span className="block bg-gradient-to-r from-[#D98B99] via-pink-500 to-purple-500 text-transparent bg-clip-text">
                perfect nails?
              </span>
            </h2>
            <p className="text-gray-600 font-light text-lg max-w-2xl mx-auto">
              Join thousands of users discovering beautiful designs and
              connecting with talented nail artists.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D98B99] to-pink-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-pink-300/40 transition-all duration-300 gap-2 group"
            >
              Get Started{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-[#3D5A6C] font-semibold rounded-xl hover:border-[#D98B99] hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 transition-all duration-300"
            >
              Browse Designs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-[#3D5A6C] mb-3">Missland</h3>
              <p className="text-sm text-gray-600 font-light">
                Virtual try-on for nail designs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#3D5A6C] text-sm mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-sm font-light">
                <li>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/try-on"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Try-On
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#3D5A6C] text-sm mb-3">
                Community
              </h4>
              <ul className="space-y-2 text-sm font-light">
                <li>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Artists
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Designs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#3D5A6C] text-sm mb-3">
                Company
              </h4>
              <ul className="space-y-2 text-sm font-light">
                <li>
                  <Link
                    href="/articles"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-gray-600 hover:text-[#D98B99] transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500 font-light">
              © 2025 Missland. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

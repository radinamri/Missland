"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Sparkles,
  Search,
  Users,
  ChevronDown,
} from "lucide-react";

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
              thousands of curated styles and connect with talented artists.
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
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
          <div className="animate-bounce">
            <ChevronDown className="w-6 h-6 text-[#D98B99]" />
          </div>
        </div>
      </section>

      {/* Feature 1: Virtual Try-On */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 md:px-8 py-20 md:py-0">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            {/* Left: Visual */}
            <div className="flex items-center justify-center order-2 md:order-1">
              <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center border-2 border-pink-200/50">
                <div className="text-center space-y-4">
                  <Camera className="w-24 h-24 text-[#D98B99] mx-auto opacity-80" />
                  <p className="text-2xl font-semibold text-[#3D5A6C]">
                    AR Try-On
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <div className="inline-block">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D98B99] to-pink-500 uppercase tracking-wide">
                    Virtual Try-On
                  </span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#3D5A6C] leading-tight">
                See designs on your hands instantly
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Point your camera at your hands and visualize any nail design in
                real-time. Our advanced AR technology shows you exactly how each
                design looks before you commit. No guessing, just confidence.
              </p>
              <Link
                href="/try-on"
                className="inline-flex items-center gap-2 text-[#D98B99] font-semibold hover:gap-4 transition-all group"
              >
                Try it now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Massive Collection */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 md:px-8 py-20 md:py-0">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div>
                <div className="inline-block">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 uppercase tracking-wide">
                    Massive Collection
                  </span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#3D5A6C] leading-tight">
                10,000+ designs to explore
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Browse our curated collection of nail designs from real artists
                and trending styles. Filter by color, style, pattern, or size.
                Every design is categorized to help you find exactly what
                matches your aesthetic.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-4 transition-all group"
              >
                Explore designs <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right: Visual */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center border-2 border-blue-200/50">
                <div className="text-center space-y-4">
                  <Sparkles className="w-24 h-24 text-blue-600 mx-auto opacity-80" />
                  <p className="text-2xl font-semibold text-[#3D5A6C]">
                    10K+ Designs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: AI-Powered Search */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 md:px-8 py-20 md:py-0">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            {/* Left: Visual */}
            <div className="flex items-center justify-center order-2 md:order-1">
              <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-2 border-purple-200/50">
                <div className="text-center space-y-4">
                  <Search className="w-24 h-24 text-purple-600 mx-auto opacity-80" />
                  <p className="text-2xl font-semibold text-[#3D5A6C]">
                    Smart Search
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <div className="inline-block">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 uppercase tracking-wide">
                    AI Discovery
                  </span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#3D5A6C] leading-tight">
                Find your style with AI
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Upload a photo or describe what you&apos;re looking for. Our
                intelligent AI understands your aesthetic and finds similar
                designs instantly. Search by color, style, complexity, or vibe.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:gap-4 transition-all group"
              >
                Search now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Artist Community */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 md:px-8 py-20 md:py-0">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div>
                <div className="inline-block">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 uppercase tracking-wide">
                    Community
                  </span>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#3D5A6C] leading-tight">
                Connect with nail artists
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Discover talented nail artists, explore their portfolios, read
                reviews from other users, and book consultations directly. Find
                your perfect artist based on their style, ratings, and location.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:gap-4 transition-all group"
              >
                Find artists <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right: Visual */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-2 border-amber-200/50">
                <div className="text-center space-y-4">
                  <Users className="w-24 h-24 text-amber-600 mx-auto opacity-80" />
                  <p className="text-2xl font-semibold text-[#3D5A6C]">
                    Pro Artists
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8 md:space-y-10">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#3D5A6C] leading-tight">
              Ready to find your
              <span className="block bg-gradient-to-r from-[#D98B99] via-pink-500 to-purple-500 text-transparent bg-clip-text">
                perfect nails?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light max-w-2xl mx-auto">
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

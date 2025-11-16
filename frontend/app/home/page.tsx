"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Sparkles,
  Search,
  Users,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to mark landing as seen and navigate
  const handleCTAClick = (path: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenLanding", "true");
    }
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-pink-50">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-12 py-20 md:py-24">
        {/* Subtle animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-bl from-[#D98B99]/20 to-transparent rounded-full blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#3D5A6C]/10 to-transparent rounded-full blur-3xl"
            style={{ transform: `translateY(${-scrollY * 0.15}px)` }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-16 md:space-y-10">
          {/* Main heading */}
          <div className="space-y-2 md:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
              Try nails before
              <br />
              <span className="text-[#D98B99]">you commit</span>
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-light px-2">
              See how any nail design looks on your hands in real-time.
              <br className="hidden md:block" />
              Explore curated styles and connect with talented artists.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 justify-center md:pt-4 px-4">
            <button
              onClick={() => handleCTAClick("/try-on")}
              className="inline-flex items-center justify-center px-7 sm:px-10 py-3.5 sm:py-5 bg-[#3D5A6C] text-white font-semibold rounded-2xl hover:bg-[#2F4A58] transition-all duration-300 gap-2 md:gap-3 text-base md:text-lg group shadow-lg shadow-[#3D5A6C]/20 cursor-pointer"
            >
              Try Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTAClick("/")}
              className="inline-flex items-center justify-center px-7 sm:px-10 py-3.5 sm:py-5 bg-white/80 backdrop-blur-sm border border-gray-200 text-[#3D5A6C] font-semibold rounded-2xl hover:bg-white hover:border-[#D98B99] transition-all duration-300 text-base md:text-lg shadow-sm cursor-pointer"
            >
              Explore Gallery
            </button>
          </div>
        </div>
      </section>

      {/* Feature 1: Virtual Try-On */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-24">
        <div className="max-w-7xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-24 items-center">
            {/* Left: Visual */}
            <div className="flex items-center justify-center order-2 md:order-1">
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg aspect-square rounded-3xl md:rounded-[40px] bg-gradient-to-br from-[#D98B99]/10 to-[#D98B99]/5 flex items-center justify-center border border-[#D98B99]/20 backdrop-blur-sm">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="w-20 h-20 md:w-24 lg:w-28 md:h-24 lg:h-28 mx-auto bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
                    <Camera className="w-10 h-10 md:w-12 lg:w-14 md:h-12 lg:h-14 text-[#D98B99]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-semibold text-[#3D5A6C]">
                    AR Try-On
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-4 md:space-y-6 order-1 md:order-2">
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-[#D98B99]/10 rounded-full">
                <span className="text-xs md:text-sm font-semibold text-[#D98B99] uppercase tracking-wide">
                  Virtual Try-On
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
                See designs on your hands instantly
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                Point your camera at your hands and visualize any nail design in
                real-time. Our advanced AR technology shows you exactly how each
                design looks before you commit.
              </p>
              <button
                onClick={() => handleCTAClick("/try-on")}
                className="inline-flex items-center gap-2 md:gap-3 text-[#D98B99] font-semibold text-base md:text-lg hover:gap-4 transition-all group pt-2 cursor-pointer"
              >
                Try it now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Massive Collection */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-24">
        <div className="max-w-7xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-24 items-center">
            {/* Left: Content */}
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-[#3D5A6C]/10 rounded-full">
                <span className="text-xs md:text-sm font-semibold text-[#3D5A6C] uppercase tracking-wide">
                  Massive Collection
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
                10,000+ designs to explore
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                Browse our curated collection of nail designs from real artists
                and trending styles. Filter by color, style, pattern, or size to
                find exactly what matches your aesthetic.
              </p>
              <button
                onClick={() => handleCTAClick("/")}
                className="inline-flex items-center gap-2 md:gap-3 text-[#3D5A6C] font-semibold text-base md:text-lg hover:gap-4 transition-all group pt-2 cursor-pointer"
              >
                Explore designs <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Right: Visual */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg aspect-square rounded-3xl md:rounded-[40px] bg-gradient-to-br from-[#3D5A6C]/10 to-[#3D5A6C]/5 flex items-center justify-center border border-[#3D5A6C]/20 backdrop-blur-sm">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="w-20 h-20 md:w-24 lg:w-28 md:h-24 lg:h-28 mx-auto bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-10 h-10 md:w-12 lg:w-14 md:h-12 lg:h-14 text-[#3D5A6C]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-semibold text-[#3D5A6C]">
                    10K+ Designs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: AI-Powered Search */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-24">
        <div className="max-w-7xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-24 items-center">
            {/* Left: Visual */}
            <div className="flex items-center justify-center order-2 md:order-1">
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg aspect-square rounded-3xl md:rounded-[40px] bg-gradient-to-br from-[#D98B99]/10 to-[#3D5A6C]/5 flex items-center justify-center border border-[#D98B99]/20 backdrop-blur-sm">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="w-20 h-20 md:w-24 lg:w-28 md:h-24 lg:h-28 mx-auto bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
                    <Search className="w-10 h-10 md:w-12 lg:w-14 md:h-12 lg:h-14 text-[#D98B99]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-semibold text-[#3D5A6C]">
                    Smart Search
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-4 md:space-y-6 order-1 md:order-2">
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-[#D98B99]/10 rounded-full">
                <span className="text-xs md:text-sm font-semibold text-[#D98B99] uppercase tracking-wide">
                  AI Discovery
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
                Find your style with AI
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                Upload a photo or describe what you&apos;re looking for. Our
                intelligent AI understands your aesthetic and finds similar
                designs instantly.
              </p>
              <button
                onClick={() => handleCTAClick("/")}
                className="inline-flex items-center gap-2 md:gap-3 text-[#D98B99] font-semibold text-base md:text-lg hover:gap-4 transition-all group pt-2 cursor-pointer"
              >
                Search now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Artist Community */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-24">
        <div className="max-w-7xl w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-24 items-center">
            {/* Left: Content */}
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-[#3D5A6C]/10 rounded-full">
                <span className="text-xs md:text-sm font-semibold text-[#3D5A6C] uppercase tracking-wide">
                  Community
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
                Connect with nail artists
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                Discover talented nail artists, explore their portfolios, read
                reviews from other users, and book consultations directly.
              </p>
              <button
                onClick={() => handleCTAClick("/")}
                className="inline-flex items-center gap-2 md:gap-3 text-[#3D5A6C] font-semibold text-base md:text-lg hover:gap-4 transition-all group pt-2 cursor-pointer"
              >
                Find artists <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Right: Visual */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm md:max-w-md lg:max-w-lg aspect-square rounded-3xl md:rounded-[40px] bg-gradient-to-br from-[#3D5A6C]/10 to-[#D98B99]/5 flex items-center justify-center border border-[#3D5A6C]/20 backdrop-blur-sm">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="w-20 h-20 md:w-24 lg:w-28 md:h-24 lg:h-28 mx-auto bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
                    <Users className="w-10 h-10 md:w-12 lg:w-14 md:h-12 lg:h-14 text-[#3D5A6C]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-semibold text-[#3D5A6C]">
                    Pro Artists
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-10">
          <div className="space-y-4 md:space-y-8">
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#3D5A6C] leading-[1.1] tracking-tight">
              Ready to find your
              <br />
              <span className="text-[#D98B99]">perfect nails?</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed px-4">
              Join thousands of users discovering beautiful designs and
              connecting with talented nail artists.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2 md:pt-4 px-4">
            <button
              onClick={() => handleCTAClick("/register")}
              className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-[#3D5A6C] text-white font-semibold rounded-2xl hover:bg-[#2F4A58] transition-all duration-300 gap-2 md:gap-3 text-base md:text-lg group shadow-lg shadow-[#3D5A6C]/20 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTAClick("/")}
              className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-white/80 backdrop-blur-sm border border-gray-200 text-[#3D5A6C] font-semibold rounded-2xl hover:bg-white hover:border-[#D98B99] transition-all duration-300 text-base md:text-lg shadow-sm cursor-pointer"
            >
              Browse Designs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 backdrop-blur-sm bg-white/30 py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-bold text-[#3D5A6C] text-xl md:text-2xl mb-2 md:mb-3">
                Missland
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed">
                Virtual try-on for nail designs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#3D5A6C] text-sm md:text-base mb-3 md:mb-4">Product</h4>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base font-light">
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
              <h4 className="font-semibold text-[#3D5A6C] text-sm md:text-base mb-3 md:mb-4">Community</h4>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base font-light">
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
              <h4 className="font-semibold text-[#3D5A6C] text-sm md:text-base mb-3 md:mb-4">Company</h4>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base font-light">
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
          <div className="border-t border-gray-200/50 pt-6 md:pt-8">
            <p className="text-center text-sm text-gray-500 font-light">
              © 2025 Missland. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

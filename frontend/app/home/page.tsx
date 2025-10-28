"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Search,
  Users,
  Camera,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const slides = [
    {
      title: "Try Your Perfect",
      highlight: "Nail Look",
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Discover Stunning",
      highlight: "Designs",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Connect With Expert",
      highlight: "Nail Artists",
      color: "from-purple-500 to-pink-500",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Camera,
      title: "Virtual Try-On",
      description:
        "See nail designs on your hands in real-time using your camera. Explore before you commit.",
      color: "from-pink-100 to-rose-100",
      borderColor: "border-pink-200",
    },
    {
      icon: Sparkles,
      title: "10,000+ Designs",
      description:
        "Access a massive curated collection of nail designs with expert categorization and trending styles.",
      color: "from-blue-100 to-cyan-100",
      borderColor: "border-blue-200",
    },
    {
      icon: Search,
      title: "AI-Powered Search",
      description:
        "Find your perfect nail design using image search and our intelligent AI assistant.",
      color: "from-purple-100 to-pink-100",
      borderColor: "border-purple-200",
    },
    {
      icon: Users,
      title: "Pro Artists",
      description:
        "Discover talented nail artists, view their portfolios, and book consultations directly.",
      color: "from-amber-100 to-orange-100",
      borderColor: "border-amber-200",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section with Carousel */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background carousel */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-15`}
              />
              {/* Decorative blobs */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className={`absolute w-96 h-96 bg-gradient-to-r ${slide.color} rounded-full blur-3xl opacity-10`}
                  style={{ top: "-20%", left: "-10%" }}
                />
                <div
                  className={`absolute w-96 h-96 bg-gradient-to-r ${slide.color} rounded-full blur-3xl opacity-10`}
                  style={{ bottom: "-20%", right: "-10%" }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200 text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-blue-600">
                    ✨ Get Your Next
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#3D5A6C] leading-tight">
                  {slides[currentSlide].title}
                  <br />
                  <span
                    className={`text-transparent bg-clip-text bg-gradient-to-r ${slides[currentSlide].color}`}
                  >
                    {slides[currentSlide].highlight}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                  Explore thousands of stunning nail designs and see them on
                  your hands instantly with AR technology. Discover, try, and
                  connect with nail artists.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/try-on"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D98B99] to-pink-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 gap-2 group"
                >
                  Try Now{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-[#3D5A6C] font-bold rounded-full hover:border-[#D98B99] hover:bg-gradient-to-r hover:from-pink-50 hover:to-transparent transition-all duration-300"
                >
                  Explore Gallery
                </Link>
              </div>

              {/* Carousel indicators */}
              <div className="flex gap-2 pt-8">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide
                        ? `w-8 bg-gradient-to-r ${slides[idx].color}`
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full max-w-md h-96">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} rounded-3xl opacity-10 transition-all duration-1000`}
                />

                {/* Decorative elements */}
                <div
                  className={`absolute top-6 right-6 w-20 h-20 bg-gradient-to-br ${slides[currentSlide].color} rounded-2xl opacity-80 transform rotate-12 transition-all duration-1000`}
                />
                <div className="absolute bottom-12 left-6 w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-200 rounded-xl opacity-60 transform -rotate-12" />
                <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-gradient-to-br from-[#D98B99] to-pink-300 rounded-full opacity-70" />

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 z-10">
                    <Camera className="w-16 h-16 text-[#D98B99] mx-auto opacity-80" />
                    <p className="text-[#3D5A6C] font-bold text-lg">
                      Point & See
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="animate-bounce">
            <ChevronDown className="w-6 h-6 text-[#D98B99]" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D5A6C]">
              How Missland Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to find and try your perfect nail designs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "1",
                title: "Browse & Search",
                description:
                  "Explore our curated collection of 10,000+ nail designs or use our AI-powered search to find exactly what you're looking for.",
                icon: "🔍",
              },
              {
                step: "2",
                title: "Try On with AR",
                description:
                  "Use your device camera to virtually try on any nail design and see how it looks on your hands in real-time.",
                icon: "📱",
              },
              {
                step: "3",
                title: "Connect & Book",
                description:
                  "Find talented nail artists, check their portfolios, save your favorite designs, and book appointments directly.",
                icon: "⭐",
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#D98B99] to-pink-500 text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-[#3D5A6C]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <div className="text-4xl">{item.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D5A6C]">
              What Makes Missland Different
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cutting-edge technology meets a thriving creative community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`group relative p-8 md:p-10 rounded-2xl border-2 ${feature.borderColor} bg-gradient-to-br ${feature.color} hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 cursor-pointer overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/50 to-transparent" />

                  <div className="relative z-10 space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white to-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-[#D98B99]" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-[#3D5A6C]">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-5 h-5 text-[#D98B99]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Community Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3D5A6C] leading-tight">
                Join Our Growing Community
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Connect with nail enthusiasts and professional artists from
                around the world. Share your favorite designs, discover new
                trends, and get inspired every day.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D98B99] to-pink-500 flex items-center justify-center text-white flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">
                      Save & Organize
                    </p>
                    <p className="text-gray-600">
                      Create collections of your favorite designs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D98B99] to-pink-500 flex items-center justify-center text-white flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">
                      Share & Inspire
                    </p>
                    <p className="text-gray-600">
                      Share your try-ons and inspire others
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D98B99] to-pink-500 flex items-center justify-center text-white flex-shrink-0 mt-1">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-[#3D5A6C]">
                      Artist Network
                    </p>
                    <p className="text-gray-600">
                      Book and rate your favorite nail artists
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#D98B99] to-pink-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-pink-300/50 transition-all duration-300 gap-2 group w-full md:w-auto"
              >
                Join Now{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right illustration */}
            <div className="hidden md:block">
              <div className="relative space-y-4">
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-3xl p-8 border-2 border-pink-200">
                  <div className="space-y-3">
                    <div className="h-3 bg-gradient-to-r from-[#D98B99] to-pink-500 rounded-full w-1/2" />
                    <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="text-3xl mb-2">👍</div>
                    <p className="text-sm font-semibold text-[#3D5A6C]">
                      5k+ Likes
                    </p>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm font-semibold text-[#3D5A6C]">
                      2k+ Comments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#D98B99] via-pink-400 to-purple-500 p-8 md:p-16 text-center space-y-6 overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute w-40 h-40 bg-white rounded-full blur-2xl top-0 right-0" />
              <div className="absolute w-40 h-40 bg-white rounded-full blur-2xl bottom-0 left-0" />
            </div>

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Sign Up to Get Your Next Nail Look
              </h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands of users discovering and sharing beautiful nail
                designs. Start your virtual try-on journey today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#D98B99] font-bold rounded-full hover:bg-gray-50 transition-all duration-300 gap-2 group"
                >
                  Get Started{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/20 border-2 border-white text-white font-bold rounded-full hover:bg-white/30 transition-all duration-300"
                >
                  Browse Designs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="font-bold text-[#3D5A6C]">Missland</h3>
              <p className="text-sm text-gray-600">
                Virtual try-on for nail designs. Explore, try, and connect with
                nail artists.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Explore
                  </Link>
                </li>
                <li>
                  <Link
                    href="/try-on"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Try-On
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Community</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Artists
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Designs
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/articles"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-[#D98B99] transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500">
              © 2025 Missland. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

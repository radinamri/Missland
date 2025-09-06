"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SearchInput from "./SearchInput";
import { useSearch } from "@/context/SearchContext";
import Icon from "@/public/icon";

export default function Header() {
  const { user, logoutUser, trackSearchQuery } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    allCategories,
    activeCategory,
    setActiveCategory,
  } = useSearch();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [{ href: "/articles", label: "Articles" }];

  // Handler for when a user clicks a category in the search suggestions
  const handleSuggestionClick = (category: string | null) => {
    setActiveCategory(category);
    setSearchTerm("");
    // In a future step, you could also trigger a filter action here
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-30">
        {/* Corrected padding to p-4 for mobile to allow justify-between to work correctly */}
        <div className="container mx-auto flex items-center justify-between p-4 md:py-5">
          {/* Left Side: Logo and Name */}
          <div className="md:flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 z-0">
              <Icon className="w-12 h-12" />
              <span className="text-xl font-bold text-gray-700">Missland</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <nav className="flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-lg font-medium transition ${
                      pathname === link.href
                        ? "text-pink-500"
                        : "text-gray-600 hover:text-pink-500"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Centered Search Input for Desktop Explore Page */}
          {pathname === "/" && (
            <div className="hidden md:block flex-grow mx-4">
              <SearchInput
                placeholder="Search nails, styles, colors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearchSubmit={trackSearchQuery}
                categories={allCategories}
                onCategoryClick={handleSuggestionClick}
                activeCategory={activeCategory}
              />
            </div>
          )}

          {/* Desktop Navigation (Right Side Group) */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              {user ? (
                <Link
                  href="/profile"
                  className="bg-pink-500 text-white font-bold py-4 px-6 rounded-2xl hover:bg-pink-600 transition"
                >
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="bg-gray-100 rounded-2xl py-4 px-6 font-bold text-gray-600 hover:bg-gray-200 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl hover:bg-gray-900 transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden z-50">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-800 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <div
        className={`fixed inset-0 bg-white z-40 transform ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Close menu"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
        <div className="flex flex-col items-center justify-center h-full space-y-8 pt-20">
          {user ? (
            <>
              <button
                onClick={logoutUser}
                className="text-3xl font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-3xl font-bold text-gray-800 hover:text-pink-500 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-gray-800 text-white font-bold py-3 px-8 rounded-xl text-xl"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

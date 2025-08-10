"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SearchInput from "./SearchInput";
import { useSearch } from "@/context/SearchContext";

export default function Header() {
  const { user, logoutUser, trackSearchQuery } = useAuth();
  const { searchTerm, setSearchTerm, allCategories } =
    useSearch();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [{ href: "/articles", label: "Articles" }];

  // Handler for when a user clicks a category in the search suggestions
  const handleSuggestionClick = (category: string) => {
    setSearchTerm(category);
    // In a future step, you could also trigger a filter action here
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-0">
        {/* Corrected padding to p-4 for mobile to allow justify-between to work correctly */}
        <div className="container mx-auto flex items-center justify-between p-4 md:py-5">
          {/* Left Side: Logo and Name */}
          <div className="md:flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 z-0">
              <svg
                className="w-9 h-9 text-pink-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="currentColor"
                />
                <path
                  d="M12 6C9.79 6 8 7.79 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 7.79 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xl md:text-2xl font-bold text-gray-800">
                NANA-AI
              </span>
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
            <div className="hidden md:block flex-grow mx-8">
              <SearchInput
                placeholder="Search nails, hair styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearchSubmit={trackSearchQuery}
                categories={allCategories}
                onCategoryClick={handleSuggestionClick}
              />
            </div>
          )}

          {/* Desktop Navigation (Right Side Group) */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              {user ? (
                <Link
                  href="/profile"
                  className="bg-pink-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-pink-600 transition"
                >
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="font-medium text-gray-600 hover:text-pink-500 transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-gray-900 transition"
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

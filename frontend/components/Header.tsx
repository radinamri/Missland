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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [{ href: "/articles", label: "Articles" }];

  const handleSuggestionClick = (category: string | null) => {
    setActiveCategory(category);
    setSearchTerm("");
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30 h-20 flex items-center">
        <div className="container mx-auto flex items-center justify-between px-4">
          {/* Left Side: Logo and Desktop Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Icon className="w-12 h-12" />
              <span className="text-2xl font-bold text-[#3D5A6C]">Missland</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base font-semibold transition ${
                    pathname.startsWith(link.href)
                      ? "text-[#D98B99]"
                      : "text-gray-500 hover:text-[#D98B99]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Search Input (Desktop Only on Homepage) */}
          {pathname === "/" && (
            <div className="hidden md:block flex-grow mx-8 lg:mx-16">
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

          {/* Right Side: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <Link
                href="/profile"
                className="bg-[#3D5A6C] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#314A5A] transition-colors"
              >
                Profile
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-[#E7E7E7] rounded-xl py-3 px-6 font-bold text-gray-700 hover:bg-[#dcdcdc] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#3D5A6C] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#314A5A] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden z-50">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-800 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
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
        {/* --- FIX: Added this close button --- */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-4 text-gray-600 hover:text-gray-900"
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

        <div className="flex flex-col items-center justify-center h-full space-y-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-3xl font-bold transition ${
                pathname.startsWith(link.href)
                  ? "text-[#D98B99]"
                  : "text-gray-800 hover:text-[#D98B99]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-4/5 border-t border-gray-200"></div>

          <div className="flex flex-col items-center space-y-8">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="text-3xl font-bold text-gray-800 hover:text-[#D98B99]"
                >
                  Profile
                </Link>
                <button
                  onClick={logoutUser}
                  className="text-xl font-medium text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-3xl font-bold text-gray-800 hover:text-[#D98B99]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#3D5A6C] text-white font-bold py-4 px-10 rounded-xl text-xl hover:bg-[#314A5A]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

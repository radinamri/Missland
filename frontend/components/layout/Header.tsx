"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import SearchInput from "@/components/common/SearchInput";
import { useSearchStore } from "@/stores/searchStore";
import { SmallLoadingSpinner } from "@/components/common/LoadingSpinner";
import Icon from "@/public/icon";
import Image from "next/image";
import FilterBar from "@/components/posts/FilterBar";

export default function Header() {
  const router = useRouter();
  const { user, logoutUser } = useAuth();
  const { trackSearchQuery } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    showFilterBar,
    setShowFilterBar,
    performTextSearch,
    resetFilters,
    fetchFilterSuggestions,
  } = useSearchStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPostDetailPage = pathname.startsWith("/post/");

  // Local state to manage the input value ONLY when on the detail page
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  useEffect(() => {
    fetchFilterSuggestions();
  }, [fetchFilterSuggestions]);

  // It handles both showing and hiding the filter bar based on the page context.
  useEffect(() => {
    const isSearchContextPage =
      pathname === "/" || pathname.startsWith("/post/");

    if (isSearchContextPage) {
      // If we are ON a search page, re-evaluate if the bar should be visible.
      const isAnyFilterActive = Object.values(filters).some((v) =>
        Array.isArray(v) ? v.length > 0 : v !== null
      );
      const isSearchTermPresent = searchTerm.trim() !== "";

      // If there's an active search state, ensure the bar is visible.
      if (isAnyFilterActive || isSearchTermPresent) {
        setShowFilterBar(true);
      }
    } else {
      // If we are NOT on a search page, ensure the bar is hidden.
      if (showFilterBar) {
        setShowFilterBar(false);
      }
    }
  }, [pathname, filters, searchTerm, showFilterBar, setShowFilterBar]);

  // When navigating away from the detail page, clear the local term to prevent stale state
  useEffect(() => {
    if (!isPostDetailPage) {
      setLocalSearchTerm("");
    }
  }, [isPostDetailPage]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const navLinks = [
    { href: "/", label: "Explore" },
    { href: "/try-on", label: "Try-On" },
    { href: "/chat", label: "AI Stylist" },
  ];

  const handleSearchSubmit = async (query: string) => {
    if (!query.trim()) return;
    performTextSearch(query);
    await trackSearchQuery(query);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleSearchClear = () => {
    resetFilters();
  };

  const showSearch = pathname === "/" || pathname.startsWith("/post/");
  const isRefreshing = useSearchStore((s) => s.isRefreshing);

  return (
    <>
      {isRefreshing && (
        <div className="w-full bg-white z-40">
          <SmallLoadingSpinner />
        </div>
      )}
      <header className="bg-white shadow-sm sticky top-0 z-30 h-auto flex flex-col items-center py-2 gap-2">
        <div className="flex items-center justify-between w-full md:px-8 px-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Icon className="w-10 h-10" />
              <span className="text-xl font-bold text-[#3D5A6C]">Missland</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-base font-semibold transition ${
                      isActive
                        ? "text-[#D98B99]"
                        : "text-gray-500 hover:text-[#D98B99]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {showSearch && (
            <div className="hidden md:block grow mx-8 lg:mx-4">
              <SearchInput
                placeholder="Search or filter nails..."
                value={isPostDetailPage ? localSearchTerm : searchTerm}
                onChange={(e) => {
                  if (isPostDetailPage) {
                    setLocalSearchTerm(e.target.value);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                onSearchSubmit={handleSearchSubmit}
                onClear={handleSearchClear}
                showFilterPanelOnFocus={true}
                isPanelTemporarilyReset={isPostDetailPage}
              />
            </div>
          )}

          <div className="hidden md:flex items-center space-x-2 relative">
            {user ? (
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden">
                <Link href="/profile">
                  <Image
                    src={user.profile_picture || "/default-profile.png"}
                    alt={user.username}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-[#E7E7E7] rounded-2xl py-3 px-4 font-bold text-gray-700 hover:bg-[#dcdcdc] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#3D5A6C] text-white font-bold py-3 px-4 rounded-2xl hover:bg-[#314A5A] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            <div className="relative group" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl transition-all duration-200 ease-out z-50 ${
                  isDropdownOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }`}
              >
                <div className="py-2 px-2">
                  <Link
                    href="/articles"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Articles
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden z-20">
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

        {showSearch && (
          <div className="md:hidden w-full px-4 pb-2">
            <SearchInput
              placeholder="Search or filter nails..."
              value={isPostDetailPage ? localSearchTerm : searchTerm}
              onChange={(e) => {
                if (isPostDetailPage) {
                  setLocalSearchTerm(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
              }}
              onSearchSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              showFilterPanelOnFocus={true}
              isPanelTemporarilyReset={isPostDetailPage}
            />
          </div>
        )}
        {showFilterBar && !isPostDetailPage && <FilterBar />}
      </header>

      <div
        className={`fixed inset-0 bg-white z-40 transform ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-4 text-gray-600 hover:text-gray-900"
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

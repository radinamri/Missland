"use client";

import { useState, useMemo } from "react";
import SearchInput from "@/components/SearchInput";

// --- FAQ Data (Updated with "Missland") ---
const faqCategories = [
  {
    title: "Application Functionality",
    questions: [
      {
        q: "What is the main purpose of Missland?",
        a: "Missland is a platform for virtual style exploration. You can browse thousands of nail and hair styles and use our augmented reality feature to see how they look on you in real-time.",
      },
      {
        q: "How does the virtual try-on work?",
        a: "Our try-on feature uses your phone's camera to create a live preview. When you select a style, our technology overlays it onto your hands or hair, allowing you to see the result instantly.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    questions: [
      {
        q: "Are my photos from the try-on feature saved?",
        a: "No, we do not automatically save any photos or videos from your live try-on sessions. Your privacy is our top priority. You can choose to manually save a photo to your 'My Try-Ons' folder.",
      },
      {
        q: "How is my personal data used?",
        a: "Your personal data is used solely for account management purposes, such as logging in, resetting your password, and managing your saved content. We do not sell or share your personal data with third parties.",
      },
    ],
  },
  {
    title: "Account Management",
    questions: [
      {
        q: "How do I change my password?",
        a: "You can change your password from the 'Account Settings' section of your profile page.",
      },
      {
        q: "How do I delete my account?",
        a: "You can delete your account from the 'Account Settings' section of your profile. Please be aware that this action is permanent and cannot be undone.",
      },
    ],
  },
];

// --- Reusable Accordion Component ---
const FaqItem = ({ q, a }: { q: string; a: string }) => (
  <details className="group bg-white p-4 rounded-lg shadow-sm cursor-pointer">
    <summary className="flex items-center justify-between font-semibold text-[#3D5A6C]">
      {q}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-open:rotate-180 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </summary>
    <p className="text-gray-600 mt-3 pt-3 border-t">{a}</p>
  </details>
);

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) {
      return faqCategories;
    }
    return faqCategories
      .map((category) => {
        const filteredQuestions = category.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.a.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...category, questions: filteredQuestions };
      })
      .filter((category) => category.questions.length > 0);
  }, [searchTerm]);

  return (
    <main className="p-4 md:p-8">
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3D5A6C]">
            Support Center
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            How can we help you today?
          </p>
        </header>

        <div className="max-w-3xl mx-auto mb-12">
          <SearchInput
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearchSubmit={() => {}}
            onClear={() => setSearchTerm("")}
          />
        </div>

        <div className="max-w-3xl mx-auto space-y-10">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category) => (
              <div key={category.title}>
                <h2 className="text-2xl font-bold text-[#3D5A6C] mb-4">
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700">
                No results found
              </h3>
              <p className="text-gray-500 mt-2">
                We couldn&apos;t find any answers matching your search. Please
                try different keywords.
              </p>
            </div>
          )}
        </div>

        <div className="mt-16 text-center border-t border-gray-200 pt-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#3D5A6C]">
            Still need help?
          </h2>
          <p className="text-gray-600 mt-2 mb-6">
            If you can&apos;t find the answer you&apos;re looking for, please
            get in touch.
          </p>
          <a
            href="mailto:support@missland.com"
            className="inline-block bg-[#3D5A6C] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#314A5A] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

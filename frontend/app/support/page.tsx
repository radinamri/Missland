"use client";

import { useState, useMemo } from "react";
import SearchInput from "@/components/SearchInput";

// --- Data for the FAQ section ---
const faqCategories = [
  // Category 1: Application Functionality (Highest Priority)
  {
    title: "Application Functionality",
    questions: [
      {
        q: "What is the main purpose of NANA-AI?",
        a: "NANA-AI is a platform for virtual style exploration. You can browse thousands of nail and hair styles and use our augmented reality feature to see how they look on you in real-time.",
      },
      {
        q: "How does the virtual try-on work?",
        a: "Our try-on feature uses your phone's camera to create a live preview. When you select a style, our technology overlays it onto your hands or hair, allowing you to see the result instantly.",
      },
      {
        q: "Why do I need to scan a QR code on my laptop?",
        a: "The live try-on requires a mobile camera for the best experience. The QR code is a simple and secure way to transfer the style you're viewing on your laptop directly to your phone to start the live camera session.",
      },
    ],
  },
  // Category 2: Security & Privacy (Crucial for User Trust)
  {
    title: "Security & Privacy",
    questions: [
      {
        q: "Are my photos from the try-on feature saved?",
        a: "No, we do not automatically save any photos or videos from your live try-on sessions. Your privacy is our top priority. You only have the option to manually save a screenshot to your 'My Try-Ons' folder if you choose to.",
      },
      {
        q: "How is my personal data (email, username) used?",
        a: "Your personal data is used solely for account management purposes, such as logging in, resetting your password, and managing your saved posts. We do not sell or share your personal data with third parties.",
      },
    ],
  },
  // Category 3: Account Management
  {
    title: "Account Management",
    questions: [
      {
        q: "How do I change my password?",
        a: "You can change your password from the 'Edit Profile' section of your profile page. You will need to enter your current password to set a new one.",
      },
      {
        q: "I signed up with Google. How do I set a password?",
        a: "Users who sign up with Google do not have a password by default. To create one, simply use the 'Forgot Password' link on the login page. A reset link will be sent to your Gmail, allowing you to set a password for your account.",
      },
      {
        q: "How do I delete my account?",
        a: "You can delete your account from the 'Preferences' section of your profile page. Please be aware that this action is permanent and cannot be undone.",
      },
    ],
  },
];

// --- Reusable component for the FAQ accordion ---
const FaqItem = ({ q, a }: { q: string; a: string }) => (
  <details className="group bg-gray-50 p-4 rounded-lg cursor-pointer">
    <summary className="flex items-center justify-between font-semibold text-gray-700">
      {q}
      <svg
        className="w-5 h-5 transition-transform duration-300 group-open:rotate-180"
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
    <p className="text-gray-600 mt-2">{a}</p>
  </details>
);

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize the filtered results to avoid re-calculating on every render
  const filteredFaqs = useMemo(() => {
    if (!searchTerm) {
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
    <div className="bg-white md:shadow-lg p-4 md:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Support Center
        </h1>
        <p className="text-lg text-gray-500 mt-2">How can we help you today?</p>
      </header>

      <SearchInput
        placeholder="Search for answers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearchSubmit={() => {}}
      />

      {/* FAQ Section */}
      <div className="space-y-10 mt-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((category) => (
            <div key={category.title}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
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
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700">
              No results found
            </h3>
            <p className="text-gray-500 mt-2">
              We couldn&apos;t find any answers matching your search. Please try
              different keywords or contact support.
            </p>
          </div>
        )}
      </div>

      {/* Contact Support Section */}
      <div className="mt-16 text-center border-t pt-10">
        <h2 className="text-3xl font-bold text-gray-800">Still need help?</h2>
        <p className="text-gray-600 mt-2 mb-6">
          If you can&apos;t find the answer you&apos;re looking for, please get
          in touch.
        </p>
        <a
          href="mailto:support@nana-ai.com"
          className="bg-gray-800 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-900 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

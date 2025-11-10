"use client";

import Image from "next/image";
import { useState } from "react";

interface NailReferencePanelProps {
  imageUrl: string;
  expanded?: boolean;
}

export default function NailReferencePanel({
  imageUrl,
  expanded = false,
}: NailReferencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 hover:bg-gray-50 transition z-10"
      >
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt="Nail reference"
            fill
            style={{ objectFit: "cover" }}
            sizes="64px"
          />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900">Nail Reference</p>
          <p className="text-sm text-gray-500">Tap to view details</p>
        </div>
        <svg
          className="w-6 h-6 text-gray-400"
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
    );
  }

  return (
    <div className="absolute bottom-20 left-0 right-0 bg-white rounded-t-3xl shadow-xl p-6 z-10 max-h-[50vh] overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Nail Reference</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
        <Image
          src={imageUrl}
          alt="Nail reference"
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, 500px"
        />
      </div>
    </div>
  );
}

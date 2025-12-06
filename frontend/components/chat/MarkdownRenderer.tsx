"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer - Renders markdown-formatted text with proper typography
 * Supports: bold, italic, code, links, numbered lists, bullets, and headers
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
      if (boldMatch) {
        elements.push(
          <strong key={key++} className="font-semibold text-gray-900">
            {parseInlineMarkdown(boldMatch[2])}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
      if (italicMatch) {
        elements.push(
          <em key={key++} className="italic text-gray-700">
            {parseInlineMarkdown(italicMatch[2])}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        elements.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 bg-gray-100 text-[#3D5A6C] rounded text-sm font-mono"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Links: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        elements.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D98B99] hover:text-[#c77a88] underline underline-offset-2 transition-colors font-medium"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Regular text - consume until next special character
      const nextSpecial = remaining.search(/[\*_`\[]/);
      if (nextSpecial === -1) {
        elements.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special char didn't match a pattern, treat as regular text
        elements.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        elements.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return elements;
  };

  const renderLine = (line: string, index: number): React.ReactNode => {
    // Headers
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      return (
        <h3 key={index} className="text-base font-semibold text-[#3D5A6C] mt-4 mb-2">
          {parseInlineMarkdown(h3Match[1])}
        </h3>
      );
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      return (
        <h2 key={index} className="text-lg font-semibold text-[#3D5A6C] mt-5 mb-2">
          {parseInlineMarkdown(h2Match[1])}
        </h2>
      );
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      return (
        <h1 key={index} className="text-xl font-bold text-[#3D5A6C] mt-6 mb-3">
          {parseInlineMarkdown(h1Match[1])}
        </h1>
      );
    }

    // Numbered list: 1. item, 2. item, etc.
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      return (
        <div key={index} className="flex gap-3 mb-3">
          <span className="font-semibold text-[#D98B99] min-w-max">
            {numberedMatch[1]}.
          </span>
          <span className="flex-1 text-gray-700">
            {parseInlineMarkdown(numberedMatch[2])}
          </span>
        </div>
      );
    }

    // Bullet list: - item, * item, • item
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      return (
        <div key={index} className="flex items-center gap-3 mb-2 ml-2">
          <span className="text-[#D98B99] font-bold flex-shrink-0">•</span>
          <span className="flex-1 text-gray-700">
            {parseInlineMarkdown(bulletMatch[1])}
          </span>
        </div>
      );
    }

    // Empty line
    if (line.trim() === "") {
      return <div key={index} className="h-2" />;
    }

    // Regular paragraph
    return (
      <p key={index} className="mb-2 leading-relaxed text-gray-700">
        {parseInlineMarkdown(line)}
      </p>
    );
  };

  const lines = content.split("\n");

  return (
    <div className={`space-y-2 ${className}`}>
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default MarkdownRenderer;

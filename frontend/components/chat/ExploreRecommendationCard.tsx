/**
 * Explore Recommendation Card
 * 
 * Engagement card shown after AI image analysis to direct users
 * to the explore page with pre-populated filters based on detected attributes.
 * 
 * Features:
 * - Displays extracted filter pills (shapes, colors, patterns, sizes)
 * - Color swatches with hex backgrounds
 * - CTA to explore similar designs
 * - Follows app design system
 */

"use client";

import { useRouter } from "next/navigation";
import { Search, ChevronRight, Sparkles } from "lucide-react";
import {
  RecommendationFilters,
  COLOR_HEX_MAP,
  buildExploreUrl,
  getFilterSummary,
} from "@/types/chat";

interface ExploreRecommendationCardProps {
  recommendation: RecommendationFilters;
  className?: string;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Filter pill for shapes, patterns, sizes
 */
function FilterPill({ label, type }: { label: string; type: "shape" | "pattern" | "size" }) {
  const icons: Record<string, string> = {
    short: "S",
    medium: "M",
    long: "L",
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
      {type === "size" && icons[label] && (
        <span className="w-4 h-4 bg-gray-200 rounded text-[10px] font-bold flex items-center justify-center">
          {icons[label]}
        </span>
      )}
      <span className="capitalize">{label}</span>
    </span>
  );
}

/**
 * Color swatch with hex background
 */
function ColorSwatch({ color, showLabel = true }: { color: string; showLabel?: boolean }) {
  const hex = COLOR_HEX_MAP[color] || "#9ca3af";
  const isLight = ["white", "cream", "yellow"].includes(color);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        isLight ? "text-gray-700" : "text-white"
      }`}
      style={{ backgroundColor: hex }}
    >
      <span
        className={`w-3 h-3 rounded-full border ${
          isLight ? "border-gray-300" : "border-white/30"
        }`}
        style={{ backgroundColor: hex }}
      />
      {showLabel && <span className="capitalize">{color}</span>}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ExploreRecommendationCard({
  recommendation,
  className = "",
}: ExploreRecommendationCardProps) {
  const router = useRouter();

  const handleExplore = () => {
    const url = buildExploreUrl(recommendation);
    router.push(url);
  };

  const filterSummary = getFilterSummary(recommendation);

  return (
    <div className={`mt-5 ${className}`}>
      <button
        onClick={handleExplore}
        className="
          relative w-full p-4 md:p-5 rounded-2xl border transition-all duration-200
          text-left group hover:shadow-lg active:scale-[0.98]
          bg-gradient-to-br from-[#F9FAFB] to-white border-[#D98B99]/30 hover:border-[#D98B99]/60
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D98B99]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Search className="w-4 h-4 text-[#D98B99]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[#3D5A6C] text-sm">
                Explore Similar Designs
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {filterSummary || "Find matching nail art"}
              </p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-[#D98B99] opacity-60 shrink-0 mt-0.5" />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Shapes */}
          {recommendation.shapes.slice(0, 1).map((shape) => (
            <FilterPill key={shape} label={shape} type="shape" />
          ))}

          {/* Colors - show up to 3, then +N */}
          {recommendation.colors.slice(0, 3).map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              showLabel={recommendation.colors.length <= 2}
            />
          ))}
          {recommendation.colors.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              +{recommendation.colors.length - 3}
            </span>
          )}

          {/* Patterns */}
          {recommendation.patterns.slice(0, 1).map((pattern) => (
            <FilterPill key={pattern} label={pattern} type="pattern" />
          ))}

          {/* Sizes */}
          {recommendation.sizes.slice(0, 1).map((size) => (
            <FilterPill key={size} label={size} type="size" />
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-sm md:text-base font-medium text-[#D98B99] group-hover:gap-2 transition-all">
          <span className="truncate">View matching designs</span>
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </button>
    </div>
  );
}

export default ExploreRecommendationCard;

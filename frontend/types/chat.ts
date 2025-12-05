/**
 * Chat Types and Utilities
 * 
 * Centralized types for AI chat assistant functionality including:
 * - Message and session types
 * - Image validation
 * - Recommendation filter parsing from AI analysis
 * - Chat title generation
 */

// =============================================================================
// Filter Constants (must match backend and explore page)
// =============================================================================

export const VALID_SHAPES = ["square", "almond", "coffin", "stiletto"] as const;
export const VALID_COLORS = [
  "red", "pink", "orange", "yellow", "green", "turquoise",
  "blue", "purple", "cream", "brown", "white", "gray", "black"
] as const;
export const VALID_PATTERNS = ["french", "ombre", "glossy", "matte", "mixed"] as const;
export const VALID_SIZES = ["short", "medium", "long"] as const;

export const COLOR_HEX_MAP: Record<string, string> = {
  red: "#f87171",
  pink: "#f9a8d4",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#34d399",
  turquoise: "#2dd4bf",
  blue: "#60a5fa",
  purple: "#c084fc",
  cream: "#fef3c7",
  brown: "#d2b48c",
  white: "#f1f5f9",
  gray: "#9ca3af",
  black: "#1f2937",
};

export type Shape = typeof VALID_SHAPES[number];
export type Color = typeof VALID_COLORS[number];
export type Pattern = typeof VALID_PATTERNS[number];
export type Size = typeof VALID_SIZES[number];

// =============================================================================
// Recommendation Filters (extracted from image analysis)
// =============================================================================

export interface RecommendationFilters {
  shapes: Shape[];
  colors: Color[];
  patterns: Pattern[];
  sizes: Size[];
  confidence?: number;
  reason?: string;
}

// =============================================================================
// Chat Message Types
// =============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string; // base64 preview for user messages
  image_analysis?: string; // AI analysis text
  recommendation?: RecommendationFilters; // Parsed filters for explore card
  isLiked?: boolean;
  isDisliked?: boolean;
}

export interface ChatSession {
  id: string;
  conversationId: string;
  title: string;
  preview: string;
  date: string;
  messages: ChatMessage[];
  isPinned?: boolean;
}

// =============================================================================
// Modal State Types
// =============================================================================

export interface DeleteModalState {
  isOpen: boolean;
  chatId: string | null;
  chatTitle: string;
}

// =============================================================================
// Image Validation
// =============================================================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file type and size
 * Only allows JPEG, PNG, and WebP images up to 5MB
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image only.",
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: "File size too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

// =============================================================================
// Image Analysis Parsing
// =============================================================================

/**
 * Parse AI image analysis text to extract structured filters
 * Uses keyword matching to identify shapes, colors, patterns, and sizes
 */
export function parseImageAnalysis(analysisText: string): RecommendationFilters {
  const text = analysisText.toLowerCase();
  
  const filters: RecommendationFilters = {
    shapes: [],
    colors: [],
    patterns: [],
    sizes: [],
  };

  // Extract shapes
  for (const shape of VALID_SHAPES) {
    if (text.includes(shape)) {
      filters.shapes.push(shape);
    }
  }

  // Extract colors (handle variations)
  const colorAliases: Record<string, Color> = {
    "nude": "cream",
    "beige": "cream",
    "coral": "pink",
    "rose": "pink",
    "blush": "pink",
    "burgundy": "red",
    "maroon": "red",
    "navy": "blue",
    "teal": "turquoise",
    "gold": "yellow",
    "silver": "gray",
    "taupe": "brown",
    "tan": "brown",
    "lavender": "purple",
    "magenta": "pink",
    "mint": "green",
    "olive": "green",
    "forest": "green",
    "sky": "blue",
    "cobalt": "blue",
    "charcoal": "gray",
    "ivory": "white",
    "pearl": "white",
  };

  // First check direct color matches
  for (const color of VALID_COLORS) {
    if (text.includes(color)) {
      if (!filters.colors.includes(color)) {
        filters.colors.push(color);
      }
    }
  }

  // Then check aliases
  for (const [alias, mappedColor] of Object.entries(colorAliases)) {
    if (text.includes(alias) && !filters.colors.includes(mappedColor)) {
      filters.colors.push(mappedColor);
    }
  }

  // Extract patterns
  for (const pattern of VALID_PATTERNS) {
    if (text.includes(pattern)) {
      filters.patterns.push(pattern);
    }
  }
  
  // Check for pattern aliases
  if (text.includes("shiny") || text.includes("shine") || text.includes("gloss")) {
    if (!filters.patterns.includes("glossy")) {
      filters.patterns.push("glossy");
    }
  }
  if (text.includes("fade") || text.includes("gradient") || text.includes("blend")) {
    if (!filters.patterns.includes("ombre")) {
      filters.patterns.push("ombre");
    }
  }
  if (text.includes("tip") && text.includes("white")) {
    if (!filters.patterns.includes("french")) {
      filters.patterns.push("french");
    }
  }

  // Extract sizes
  for (const size of VALID_SIZES) {
    if (text.includes(size)) {
      filters.sizes.push(size);
    }
  }

  // Check size aliases
  if (text.includes("lengthy") || text.includes("elongated") || text.includes("extended")) {
    if (!filters.sizes.includes("long")) {
      filters.sizes.push("long");
    }
  }
  if (text.includes("mini") || text.includes("tiny") || text.includes("petite")) {
    if (!filters.sizes.includes("short")) {
      filters.sizes.push("short");
    }
  }

  return filters;
}

/**
 * Check if recommendation has any actionable filters
 */
export function hasActionableFilters(recommendation: RecommendationFilters): boolean {
  return (
    recommendation.shapes.length > 0 ||
    recommendation.colors.length > 0 ||
    recommendation.patterns.length > 0 ||
    recommendation.sizes.length > 0
  );
}

// =============================================================================
// URL Building for Explore Navigation
// =============================================================================

/**
 * Build explore page URL with filter query parameters
 * Format: /?shape=almond&colors=red,pink&pattern=ombre&size=medium
 * Note: Explore page is at root path /
 */
export function buildExploreUrl(filters: RecommendationFilters): string {
  const params = new URLSearchParams();

  // Single-select fields: take first item
  if (filters.shapes.length > 0) {
    params.set("shape", filters.shapes[0]);
  }
  if (filters.patterns.length > 0) {
    params.set("pattern", filters.patterns[0]);
  }
  if (filters.sizes.length > 0) {
    params.set("size", filters.sizes[0]);
  }

  // Multi-select: colors
  if (filters.colors.length > 0) {
    params.set("colors", filters.colors.join(","));
  }

  // Add source tracking
  params.set("from", "ai-chat");

  const queryString = params.toString();
  return queryString ? `/?${queryString}` : "/";
}

// =============================================================================
// Chat Title Generation
// =============================================================================

/**
 * Generate a chat title from the first user message
 * - For text messages: Extract key words (max 5 words)
 * - For image-only messages: Use a descriptive default
 */
export function generateChatTitle(firstUserMessage: ChatMessage): string {
  const content = firstUserMessage.content?.trim();
  const hasImage = !!firstUserMessage.image;

  // If no text content, generate based on image
  if (!content && hasImage) {
    return "Nail Design Analysis";
  }

  // If no content at all
  if (!content) {
    return "New Chat";
  }

  // Clean and truncate the text
  const cleaned = content
    .replace(/[^\w\s]/g, " ") // Remove special chars
    .replace(/\s+/g, " ")     // Normalize whitespace
    .trim();

  // Split into words and take first 5
  const words = cleaned.split(" ").filter(w => w.length > 0);
  
  if (words.length === 0) {
    return hasImage ? "Nail Design Analysis" : "New Chat";
  }

  // Create title from first few words
  const titleWords = words.slice(0, 5);
  let title = titleWords.join(" ");

  // Add ellipsis if truncated
  if (words.length > 5) {
    title += "...";
  }

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Get filter summary for display
 */
export function getFilterSummary(filters: RecommendationFilters): string {
  const parts: string[] = [];

  if (filters.shapes.length > 0) {
    parts.push(capitalize(filters.shapes[0]));
  }
  if (filters.colors.length > 0) {
    if (filters.colors.length <= 2) {
      parts.push(filters.colors.map(capitalize).join(" & "));
    } else {
      parts.push(`${capitalize(filters.colors[0])} +${filters.colors.length - 1}`);
    }
  }
  if (filters.patterns.length > 0) {
    parts.push(capitalize(filters.patterns[0]));
  }
  if (filters.sizes.length > 0) {
    parts.push(capitalize(filters.sizes[0]));
  }

  return parts.join(" • ");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

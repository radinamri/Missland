# keyword_extractor.py

"""
Keyword extraction utility for parsing and normalizing nail search queries.
Maps various synonyms and variants to the canonical forms used by the app.
"""

import re
from typing import Dict, Optional, Tuple
from .color_constants import COLOR_SIMPLIFICATION_MAP

# ===== CANONICAL OPTIONS FOR YOUR APP =====
SHAPE_OPTIONS = ["square", "almond", "coffin", "stiletto"]
PATTERN_OPTIONS = ["french", "ombre", "glossy", "matte", "mixed"]
SIZE_OPTIONS = ["short", "medium", "long"]
COLOR_OPTIONS = [
    "red", "pink", "orange", "yellow", "green", "turquoise", "blue", "purple",
    "cream", "brown", "white", "gray", "black"
]

# ===== SHAPE NORMALIZATION MAP (maps to your canonical shapes) =====
SHAPE_NORMALIZATION_MAP = {
    'oval': 'almond',
    'round': 'almond',
    'rounded': 'almond',
    'ballerina': 'coffin',
    'tapered': 'coffin',
    'square': 'square',
    'squoval': 'square',
    'stiletto': 'stiletto',
    'pointed': 'stiletto',
    'sharp': 'stiletto',
    'almond': 'almond',
    'coffin': 'coffin',
}

# ===== PATTERN NORMALIZATION MAP (maps to your canonical patterns) =====
PATTERN_NORMALIZATION_MAP = {
    'gradient': 'ombre',
    'ombre': 'ombre',
    'fade': 'ombre',
    'french tips': 'french',
    'french tip': 'french',
    'french': 'french',
    'french manicure': 'french',
    'glossy': 'glossy',
    'shiny': 'glossy',
    'chrome': 'glossy',
    'metallic': 'glossy',
    'matte': 'matte',
    'flat': 'matte',
    'mixed': 'mixed',
    'multicolor': 'mixed',
    'multi-color': 'mixed',
    'colorful': 'mixed',
}

# ===== SIZE NORMALIZATION MAP (maps to your canonical sizes) =====
SIZE_NORMALIZATION_MAP = {
    'small': 'short',
    'tiny': 'short',
    'short': 'short',
    'petite': 'short',
    'medium': 'medium',
    'average': 'medium',
    'regular': 'medium',
    'large': 'long',
    'big': 'long',
    'long': 'long',
    'extra long': 'long',
    'xl': 'long',
}


def _normalize_text(text: str) -> str:
    """Normalizes text for consistent matching."""
    text = text.lower()
    text = text.replace('_', ' ').replace('-', ' ')
    return re.sub(r'\s+', ' ', text).strip()


def _extract_and_remove_keyword(text: str, normalization_map: Dict[str, str]) -> Tuple[Optional[str], str]:
    """
    Finds a keyword, returns its canonical form, and removes it from the text.
    Sorts keys by length to match longer phrases first (e.g., "french tips" before "french").
    """
    sorted_keys = sorted(normalization_map.keys(), key=len, reverse=True)

    for variant in sorted_keys:
        pattern = r'\b' + re.escape(variant) + r'\b'
        if re.search(pattern, text):
            canonical_form = normalization_map[variant]
            # Remove the found variant from the text to get the remainder
            remaining_text = re.sub(pattern, '', text, count=1).strip()
            return canonical_form, _normalize_text(remaining_text)

    return None, text


def extract_nail_keywords(query: str) -> Tuple[Dict[str, Optional[str]], str]:
    """
    Extracts structured keywords from a query and returns the remaining text.
    
    Args:
        query: Natural language input string (e.g., "short navy coffin nails").
        
    Returns:
        A tuple containing:
        - A dictionary of extracted keywords (e.g., {'color': 'blue', 'shape': 'coffin', 'size': 'short'}).
        - A string with the remaining text after extraction (e.g., "nails").
    """
    normalized_query = _normalize_text(query)

    result = {"color": None, "shape": None, "pattern": None, "size": None}

    # Sequentially extract each keyword, updating the query string each time
    result["color"], normalized_query = _extract_and_remove_keyword(normalized_query, COLOR_SIMPLIFICATION_MAP)
    result["shape"], normalized_query = _extract_and_remove_keyword(normalized_query, SHAPE_NORMALIZATION_MAP)
    result["pattern"], normalized_query = _extract_and_remove_keyword(normalized_query, PATTERN_NORMALIZATION_MAP)
    result["size"], normalized_query = _extract_and_remove_keyword(normalized_query, SIZE_NORMALIZATION_MAP)

    return result, normalized_query


# Example usage for testing
if __name__ == "__main__":
    test_queries = [
        "blue ombre nail",
        "short burgundy coffin nails with french manicure",
        "shiny pink almond",
        "long square matte black",
        "navy gradient stiletto",
        "tiny nude ballerina with glossy finish",
        "multicolor round nails",
    ]

    print("=== Nail Keyword Extraction Examples ===\n")
    for query in test_queries:
        keywords, remainder = extract_nail_keywords(query)
        print(f"Query:     '{query}'")
        print(f"Keywords:  {keywords}")
        print(f"Remainder: '{remainder}'\n")

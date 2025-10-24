"""Color simplification constants mapping detailed variants to base colors."""

# Comprehensive color simplification map: ALL variants → generalized base color
# This ensures search results only show: red, pink, orange, yellow, green,
# blue, purple, brown, gray, black, white (11 base colors)
COLOR_SIMPLIFICATION_MAP = {
    # ===== BLUE FAMILY =====
    'navy': 'blue',
    'midnight_blue': 'blue',
    'sky_blue': 'blue',
    'powder_blue': 'blue',
    'cyan': 'blue',
    'teal': 'blue',
    'bright_blue': 'blue',
    'dark_blue': 'blue',
    'light_blue': 'blue',
    'pale_blue': 'blue',
    'blue': 'blue',

    # ===== RED FAMILY =====
    'burgundy': 'red',
    'dark_red': 'red',
    'bright_red': 'red',
    'light_red': 'red',
    'vivid_red': 'red',
    'crimson': 'red',
    'maroon': 'red',
    'bright_maroon': 'red',
    'dark_maroon': 'red',
    'red': 'red',

    # ===== PINK FAMILY =====
    'soft_pink': 'pink',
    'baby_pink': 'pink',
    'hot_pink': 'pink',
    'rose': 'pink',
    'nude': 'pink',
    'bright_pink': 'pink',
    'dark_pink': 'pink',
    'light_pink': 'pink',
    'pink': 'pink',
    'lilac': 'pink',
    'fuchsia': 'pink',

    # ===== PURPLE FAMILY =====
    'lavender': 'purple',
    'magenta': 'purple',
    'plum': 'purple',
    'violet': 'purple',
    'bright_purple': 'purple',
    'dark_purple': 'purple',
    'light_purple': 'purple',
    'purple': 'purple',

    # ===== GREEN FAMILY =====
    'mint': 'green',
    'sage': 'green',
    'forest_green': 'green',
    'olive': 'green',
    'lime': 'green',
    'bright_green': 'green',
    'dark_green': 'green',
    'light_green': 'green',
    'green': 'green',

    # ===== YELLOW FAMILY =====
    'gold': 'yellow',
    'mustard': 'yellow',
    'amber': 'yellow',
    'bright_yellow': 'yellow',
    'dark_yellow': 'yellow',
    'light_yellow': 'yellow',
    'yellow': 'yellow',
    'light_beige': 'yellow',
    'beige': 'yellow',
    'champagne': 'yellow',

    # ===== ORANGE FAMILY =====
    'peach': 'orange',
    'coral': 'orange',
    'salmon': 'orange',
    'burnt_orange': 'orange',
    'bright_orange': 'orange',
    'dark_orange': 'orange',
    'light_orange': 'orange',
    'orange': 'orange',

    # ===== BROWN FAMILY =====
    'tan': 'brown',
    'chocolate': 'brown',
    'khaki': 'brown',
    'bright_brown': 'brown',
    'dark_brown': 'brown',
    'light_brown': 'brown',
    'dark_beige': 'brown',
    'brown': 'brown',

    # ===== GRAY FAMILY =====
    'dark_gray': 'gray',
    'light_gray': 'gray',
    'silver': 'gray',
    'jet': 'gray',
    'bright_gray': 'gray',
    'grey': 'gray',
    'gray': 'gray',

    # ===== BLACK =====
    'black': 'black',

    # ===== WHITE =====
    'white': 'white',
    'off_white': 'white',
    'ivory': 'white',

}

# Color families for similarity checking
COLOR_FAMILIES = [
    {'red', 'maroon', 'crimson', 'burgundy'},
    {'blue', 'navy', 'cyan', 'turquoise'},
    {'green', 'lime', 'olive', 'teal'},
    {'yellow', 'gold', 'amber'},
    {'purple', 'violet', 'magenta', 'lavender'},
    {'orange', 'coral', 'peach'},
    {'pink', 'rose', 'salmon'},
    {'brown', 'beige', 'tan', 'khaki'},
    {'gray', 'grey', 'silver'}
]

// utils/keywordMaps.ts

export const SHAPE_NORMALIZATION_MAP: { [key: string]: string } = {
  oval: "almond",
  round: "almond",
  rounded: "almond",
  ballerina: "coffin",
  tapered: "coffin",
  square: "square",
  squoval: "square",
  stiletto: "stiletto",
  pointed: "stiletto",
  sharp: "stiletto",
  almond: "almond",
  coffin: "coffin",
};

export const PATTERN_NORMALIZATION_MAP: { [key: string]: string } = {
  gradient: "ombre",
  ombre: "ombre",
  fade: "ombre",
  "french tips": "french",
  "french tip": "french",
  french: "french",
  "french manicure": "french",
  glossy: "glossy",
  shiny: "glossy",
  chrome: "glossy",
  metallic: "glossy",
  matte: "matte",
  flat: "matte",
  mixed: "mixed",
  multicolor: "mixed",
  "multi-color": "mixed",
  colorful: "mixed",
};

export const SIZE_NORMALIZATION_MAP: { [key: string]: string } = {
  small: "short",
  tiny: "short",
  short: "short",
  petite: "short",
  medium: "medium",
  average: "medium",
  regular: "medium",
  large: "long",
  big: "long",
  long: "long",
  "extra long": "long",
  xl: "long",
};

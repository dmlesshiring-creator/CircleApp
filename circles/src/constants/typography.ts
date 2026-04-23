export const Typography = {
  // Font Families
  // Placeholder — we'll load custom fonts (e.g., Inter, Poppins) in a later step
  fontFamily: {
    display: 'System',  // headings & display text (can override with custom)
    body: 'System',     // body & interface text (can override with custom)
  },

  // Font Sizes
  fontSize: {
    xs: 11,    // small labels, captions
    sm: 13,    // secondary text, badges
    md: 15,    // body text (default)
    lg: 17,    // section headers
    xl: 20,    // large headers
    xxl: 24,   // page titles
    xxxl: 30,  // hero/display text
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,     // normal weight
    medium: '500' as const,      // slightly heavier
    semibold: '600' as const,    // semi-bold
    bold: '700' as const,        // bold
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,      // compact spacing (headings)
    normal: 1.5,     // default spacing (body)
    relaxed: 1.75,   // generous spacing (long-form)
  },
} as const;

export type FontSize = keyof typeof Typography.fontSize;
export type FontWeight = keyof typeof Typography.fontWeight;
export type LineHeight = keyof typeof Typography.lineHeight;

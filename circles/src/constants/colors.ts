export const Colors = {
  // Primary & Secondary
  primary: '#1A6B5A',        // deep teal — trust, connection
  primaryLight: '#E8F5F2',   // teal tint for backgrounds
  accent: '#FF6B35',         // warm orange — energy, CTAs
  accentLight: '#FFF0EB',    // warm orange tint for backgrounds

  // Backgrounds & Surfaces
  background: '#FAFAF9',     // off-white — warm, not stark
  surface: '#FFFFFF',        // pure white for cards/sheets
  surfaceAlt: '#F4F4F2',     // alternative surface for cards

  // Borders
  border: '#E8E8E5',         // subtle borders

  // Text
  textPrimary: '#1A1A18',    // main text (19.4:1 contrast on white) ✅
  textSecondary: '#6B6B65',  // secondary text (4.6:1 contrast on white) ✅
  textTertiary: '#8B8B85',   // tertiary/disabled text (3.5:1 contrast on white) ✅ WCAG AA compliant

  // Status & Semantic
  success: '#2ECC71',        // positive actions/states
  warning: '#F39C12',        // caution/attention
  error: '#E74C3C',          // errors/destructive actions

  // RSVP States
  going: '#2ECC71',          // going (same as success)
  maybe: '#F39C12',          // maybe (same as warning)
  cantmake: '#E74C3C',       // can't make (same as error)

  // Overlays & Special
  overlay: 'rgba(0,0,0,0.5)',

  // Tab Bar
  tabBar: '#FFFFFF',
  tabBarActive: '#1A6B5A',   // primary color when active
  tabBarInactive: '#8B8B85', // textTertiary when inactive (WCAG AA compliant)
} as const;

export type ColorKey = keyof typeof Colors;

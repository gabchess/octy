// Design tokens — Nosana brand palette, dark theme
export const COLORS = {
  bg: "#0a0a0a",
  text: "#ffffff",
  accent: "#00d4aa",
  accentDim: "#00a882",
  textDim: "#a0a0a0",
  cardBg: "#111111",
  border: "#1e1e1e",
  placeholder: "#1a1a1a",
} as const;

export const FONTS = {
  // Space Grotesk loaded via Google Fonts in index.html; Inter as fallback
  sans: '"Space Grotesk", Inter, system-ui, sans-serif',
} as const;

// Video config
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
export const VIDEO_DURATION_FRAMES = 1800; // 60 seconds

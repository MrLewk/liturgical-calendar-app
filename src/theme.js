// Design tokens for light/dark mode. Structural colors (bg/surface/text/
// border) fully swap between themes. Liturgical season colors (defined in
// App.jsx's SEASONS/WHEEL data) stay largely constant across themes since
// they're saturated enough to read on both — the one exception is gold,
// which is too light for text on a light background, so seasonAccent()
// below picks a readable variant per theme rather than hardcoding one.

export const palettes = {
  dark: {
    mode: "dark",
    bg: "#211F1D",
    bgOuter: "#0f0e0d",
    surface: "#2A2825",
    surfaceRaised: "#1A1918",
    border: "#3a3835",
    text: "#EDE7DC",
  },
  light: {
    mode: "light",
    bg: "#F5F0E6",
    bgOuter: "#E4DCC8",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    border: "#DED5C0",
    text: "#2B2620",
  },
};

// Converts a hex color + 0-1 opacity into an rgba() string, replacing the
// old pattern of hardcoded hex+alpha-suffix strings (e.g. "#EDE7DC66") with
// something that works against either theme's base text color.
export function alpha(hex, opacity) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Returns a readable accent color for a given season, adjusted for theme.
// Dark mode uses the season's pre-defined lighter `accent` tint (designed to
// pop against dark ink). Light mode uses the more saturated base `color`
// instead, since the light accent tints are too washed-out against a pale
// background — except gold, which needs darkening further either way.
export function seasonAccent(season, mode) {
  if (mode === "dark") return season.accent;
  if (season.color === "#C9A227") return "#8A6A14";
  return season.color;
}

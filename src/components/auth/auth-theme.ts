/**
 * Colours for the Hexclave auth widgets. The SDK parses these with the `color`
 * package, so they must be literal colours, not CSS variables. They mirror the
 * primitives in src/styles/tokens.css; change both together.
 */
export const AUTH_THEME = {
  radius: "0.875rem",
  light: {
    primary: "#6b3df5", // ds-allow: Hexclave theme needs literal colours (--b-500)
    primaryForeground: "#ffffff", // ds-allow: --n-0
    background: "#ffffff", // ds-allow: --n-0
    foreground: "#15131d", // ds-allow: --n-900
    muted: "#f5f3fa", // ds-allow: --n-50
    mutedForeground: "#57526a", // ds-allow: --n-600
    border: "#e2deec", // ds-allow: --n-200
    input: "#cbc6d9", // ds-allow: --n-300
    ring: "#6b3df5", // ds-allow: --b-500
  },
  dark: {
    primary: "#7650fa", // ds-allow: --b-450
    primaryForeground: "#ffffff", // ds-allow: --n-0
    background: "#120e1f", // ds-allow: --n-925
    foreground: "#f5f3fa", // ds-allow: --n-50
    muted: "#211b30", // ds-allow: --n-850
    mutedForeground: "#cbc6d9", // ds-allow: --n-300
    border: "#2a2439", // ds-allow: --n-800
    input: "#3d384d", // ds-allow: --n-700
    ring: "#9474ff", // ds-allow: --b-400
  },
};

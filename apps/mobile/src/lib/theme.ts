// Tokens from the web DESIGN.md ("Story-sticker" world). Components read the
// semantic palette from useTheme(); raw hex lives only in this file.
import { useColorScheme } from "react-native";

const light = {
  action: "#6b3df5", // loop-violet: the only action colour
  actionDeep: "#5a2be0", // violet text on white
  actionText: "#ffffff",
  mist: "#f2edff",
  mistBorder: "#d0c0ff",
  points: "#ffd43b",
  pointsText: "#7a5a00",
  pointsSubtle: "#fff6cc",
  mint: "#3ddc97",
  mintText: "#0a6e4d",
  mintSubtle: "#ddf8ec",
  danger: "#b81d31",
  dangerSubtle: "#ffe5e8",
  ink: "#15131d",
  inkMuted: "#57526a",
  inkSubtle: "#6c6780",
  ground: "#ffffff",
  surface: "#ffffff",
  muted: "#f5f3fa",
  sunken: "#ebe8f3",
  hairline: "#e2deec",
  hairlineStrong: "#cbc6d9",
  shadow: "#15131d",
};

export type Palette = typeof light;

const dark: Palette = {
  ...light,
  action: "#7650fa",
  actionDeep: "#b9a4ff",
  mist: "#241c3d",
  mistBorder: "#3d2f6b",
  pointsSubtle: "#2e2709",
  pointsText: "#ffd43b",
  mintSubtle: "#0f2a20",
  mintText: "#3ddc97",
  dangerSubtle: "#3a1117",
  danger: "#ff8a99",
  ink: "#f4f2fa",
  inkMuted: "#bdb7cf",
  inkSubtle: "#9a94ad",
  ground: "#0d0a17",
  surface: "#120e1f",
  muted: "#211b30",
  sunken: "#2a2340",
  hairline: "#2a2340",
  hairlineStrong: "#3a3352",
  shadow: "#000000",
};

export function useTheme(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = { field: 14, card: 20, sticker: 22, sheet: 28, pill: 9999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const type = {
  caption: { fontSize: 12, fontWeight: "600" as const },
  label: { fontSize: 14, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 18, fontWeight: "700" as const, lineHeight: 24 },
  sticker: { fontSize: 26, fontWeight: "800" as const, letterSpacing: -0.5, lineHeight: 28 },
};

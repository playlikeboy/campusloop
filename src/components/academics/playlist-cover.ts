/**
 * Study-playlist cover themes. The theme key is what `coverGradient` stores;
 * legacy rows hold raw Tailwind gradient classes and fall back to "ink".
 */
export const PLAYLIST_COVER_THEMES = [
  { value: "ink", label: "Ink", className: "bg-fg text-bg" },
  { value: "brand", label: "Loop Blue", className: "bg-brand text-brand-fg" },
] as const;

export type PlaylistCoverTheme = (typeof PLAYLIST_COVER_THEMES)[number]["value"];

export function playlistCoverClass(value?: string | null): string {
  return PLAYLIST_COVER_THEMES.find((t) => t.value === value)?.className ?? PLAYLIST_COVER_THEMES[0].className;
}

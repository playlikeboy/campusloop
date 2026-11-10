/**
 * How a story is stored, shared by the story creator and the story viewer.
 *
 * The stories table only has `text`, `mediaUrl` and `backgroundColor`, so:
 * - `backgroundColor` holds Tailwind classes: one background, one font style,
 *   one alignment and one text size.
 * - Stickers live in `text` as one line each, before the user's own text:
 *   "<pin> Library", "<note> Song — Artist", "<at>username", "<timer> Title|ISO date".
 *   The marker characters are written as escapes because they are a storage
 *   format, not UI. Old stories used the same pin/note markers, so they still parse.
 */

export type StoryBackground = { id: string; label: string; className: string };

/** Flat colours a student can pick for a text story. User content, not UI colour. */
export const STORY_BACKGROUNDS: StoryBackground[] = [
  { id: "violet", label: "Violet", className: "bg-story-field" },
  { id: "night", label: "Night", className: "bg-black" },
  // ds-allow: user-picked story colour, saved on the story
  { id: "red", label: "Red", className: "bg-rose-700" },
  // ds-allow: user-picked story colour, saved on the story
  { id: "green", label: "Green", className: "bg-emerald-800" },
  // ds-allow: user-picked story colour, saved on the story
  { id: "blue", label: "Blue", className: "bg-sky-800" },
  // ds-allow: user-picked story colour, saved on the story
  { id: "orange", label: "Orange", className: "bg-orange-700" },
];

/**
 * The old creator saved gradient backgrounds. Stories in highlights keep them,
 * so they are shown as the closest flat colour instead.
 */
const LEGACY_HUES: [RegExp, string][] = [
  [/violet|purple|fuchsia|indigo/, "bg-story-field"],
  [/orange|amber/, STORY_BACKGROUNDS[5].className],
  [/emerald|teal/, STORY_BACKGROUNDS[3].className],
  [/cyan|blue|sky/, STORY_BACKGROUNDS[4].className],
  [/rose|red|pink/, STORY_BACKGROUNDS[2].className],
];

function flattenLegacyBackground(classes: string[]): string {
  const joined = classes.join(" ");
  if (!/\b(?:from|via|to)-/.test(joined)) return joined;
  const first = classes.find((c) => c.startsWith("from-")) ?? joined;
  return LEGACY_HUES.find(([re]) => re.test(first))?.[1] ?? "bg-black";
}

export type StoryFont = { id: string; label: string; className: string };

export const STORY_FONTS: StoryFont[] = [
  { id: "classic", label: "Classic", className: "font-sans font-semibold" },
  { id: "caption", label: "Caption", className: "sticker-caption" },
  { id: "loud", label: "Loud", className: "sticker-caption uppercase" },
];

export type StoryTextSize = { id: string; label: string; className: string };

export const STORY_TEXT_SIZES: StoryTextSize[] = [
  { id: "sm", label: "Small", className: "text-xl" },
  { id: "md", label: "Medium", className: "text-2xl" },
  { id: "lg", label: "Large", className: "text-4xl" },
];

export const STORY_ALIGNMENTS = ["center", "left", "right"] as const;
export type StoryAlignment = (typeof STORY_ALIGNMENTS)[number];

export const ALIGN_CLASS: Record<StoryAlignment, string> = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
};

/** Joins the creator's picks into the saved `backgroundColor` string. */
export function buildStoryClasses(
  background: StoryBackground,
  font: StoryFont,
  size: StoryTextSize,
  align: StoryAlignment
): string {
  return [background.className, font.className, size.className, ALIGN_CLASS[align]].join(" ");
}

const BACKGROUND_PREFIXES = ["bg-", "from-", "via-", "to-"];

/** Splits a saved class string into background classes and text classes. */
export function splitStoryClasses(saved: string | null | undefined): {
  background: string;
  text: string;
} {
  const tokens = (saved ?? "").split(/\s+/).filter(Boolean);
  const background = tokens.filter((t) => BACKGROUND_PREFIXES.some((p) => t.startsWith(p)));
  const text = tokens.filter((t) => !BACKGROUND_PREFIXES.some((p) => t.startsWith(p)));
  return { background: flattenLegacyBackground(background) || "bg-story-field", text: text.join(" ") };
}

const PIN = "\u{1F4CD} ";
const NOTE = "\u{1F3B5} ";
const TIMER = "\u{23F3} ";
const MENTION_RE = /^@([a-z0-9_.]{2,30})$/i;

export type StorySong = { title: string; artist: string };
export type StoryCountdown = { title: string; target: string };

export type StoryStickers = {
  location: string | null;
  song: StorySong | null;
  mention: string | null;
  countdown: StoryCountdown | null;
};

export const EMPTY_STICKERS: StoryStickers = {
  location: null,
  song: null,
  mention: null,
  countdown: null,
};

/** Cleans a typed username: drops a leading "@" and anything not allowed in usernames. */
export function cleanUsername(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_.]/gi, "")
    .slice(0, 30);
}

/** Builds the saved `text`: sticker lines first, then what the student wrote. */
export function encodeStoryText(stickers: StoryStickers, body: string): string | null {
  const lines: string[] = [];
  if (stickers.location) lines.push(`${PIN}${stickers.location}`);
  if (stickers.song) {
    lines.push(
      stickers.song.artist
        ? `${NOTE}${stickers.song.title} — ${stickers.song.artist}`
        : `${NOTE}${stickers.song.title}`
    );
  }
  if (stickers.mention) lines.push(`@${stickers.mention}`);
  if (stickers.countdown) lines.push(`${TIMER}${stickers.countdown.title}|${stickers.countdown.target}`);
  const trimmed = body.trim();
  if (trimmed) lines.push(trimmed);
  return lines.length ? lines.join("\n\n") : null;
}

/** Reads sticker lines back out of a saved story. Anything else stays as body text. */
export function decodeStoryText(text: string | null | undefined): { stickers: StoryStickers; body: string } {
  const stickers: StoryStickers = { ...EMPTY_STICKERS };
  const rest: string[] = [];

  for (const block of (text ?? "").split(/\n{2,}/)) {
    const line = block.trim();
    if (!line) continue;
    if (!stickers.location && line.startsWith(PIN)) {
      stickers.location = line.slice(PIN.length).trim();
    } else if (!stickers.song && line.startsWith(NOTE)) {
      const [title, ...artist] = line.slice(NOTE.length).split(" — ");
      stickers.song = { title: title.trim(), artist: artist.join(" — ").trim() };
    } else if (!stickers.countdown && line.startsWith(TIMER) && line.includes("|")) {
      const [title, target] = line.slice(TIMER.length).split("|");
      if (target && !Number.isNaN(Date.parse(target))) {
        stickers.countdown = { title: title.trim(), target: target.trim() };
      } else {
        rest.push(line);
      }
    } else if (!stickers.mention && MENTION_RE.test(line)) {
      stickers.mention = line.slice(1);
    } else {
      rest.push(block.trim());
    }
  }

  return { stickers, body: rest.join("\n\n") };
}

/**
 * "Embed anything" for articles.
 *
 * resolveArticleEmbed(url) turns a pasted link into a render plan. Iframe
 * sources are always rebuilt from parsed ids on known hosts, never passed
 * through, so an article can only embed what this file allows. Unknown links
 * become a rich link card (OpenGraph preview).
 *
 * Pure module: shared by the renderer, the editor, the MCP spec and tests.
 */

export type EmbedKind = "iframe" | "video" | "audio" | "image" | "card" | "gist";

export interface EmbedPlan {
  provider: string;
  kind: EmbedKind;
  /** iframe/media source, or the original URL for cards. */
  src: string;
  url: string;
  /** width / height; used when height is not fixed. */
  aspect?: number;
  /** Fixed pixel height (audio players, tweets, code). */
  height?: number;
  title: string;
  allow?: string;
  /** Show a thumbnail and load the iframe on click (heavy players). */
  facade?: { thumbnail: string };
  /** Twitch requires the embedding hostname as `parent`; filled in on the client. */
  needsParent?: boolean;
}

const VIDEO_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

function parse(url: string): URL | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

const id = (s: string | null | undefined, re = /^[A-Za-z0-9_-]{2,64}$/) => (s && re.test(s) ? s : null);

/** "1h2m3s", "90", "1:30" -> seconds */
export function parseStart(t: string | null | undefined): number | undefined {
  if (!t) return undefined;
  if (/^\d+$/.test(t)) return Number(t);
  const hms = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
  const colon = t.split(":").map(Number);
  if (colon.every(Number.isFinite) && colon.length <= 3) return colon.reduce((a, b) => a * 60 + b, 0);
  return undefined;
}

export function youTubeId(u: URL): string | null {
  const h = u.hostname.replace(/^www\.|^m\./, "");
  if (h === "youtu.be") return id(u.pathname.slice(1).split("/")[0], /^[A-Za-z0-9_-]{11}$/);
  if (h === "youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com") {
    if (u.pathname === "/watch") return id(u.searchParams.get("v"), /^[A-Za-z0-9_-]{11}$/);
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

export function resolveArticleEmbed(raw: string, opts: { start?: number } = {}): EmbedPlan | null {
  const u = parse(raw);
  if (!u) return null;
  const url = u.toString();
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname;
  const ext = path.split(".").pop()?.toLowerCase() ?? "";

  // ── Video ──
  const yt = youTubeId(u);
  if (yt) {
    const start = opts.start ?? parseStart(u.searchParams.get("t") ?? u.searchParams.get("start"));
    const isShort = path.startsWith("/shorts/");
    return {
      provider: "YouTube",
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0${start ? `&start=${start}` : ""}`,
      url,
      aspect: isShort ? 9 / 16 : 16 / 9,
      title: "YouTube video",
      allow: VIDEO_ALLOW,
      facade: { thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` },
    };
  }
  if ((host === "youtube.com" || host === "m.youtube.com") && path === "/playlist") {
    const list = id(u.searchParams.get("list"));
    if (list) return { provider: "YouTube", kind: "iframe", src: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`, url, aspect: 16 / 9, title: "YouTube playlist", allow: VIDEO_ALLOW };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = path.match(/(\d{6,12})/);
    if (m) return { provider: "Vimeo", kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}`, url, aspect: 16 / 9, title: "Vimeo video", allow: VIDEO_ALLOW };
  }
  if (host === "loom.com") {
    const m = path.match(/\/(?:share|embed)\/([a-f0-9]{20,40})/);
    if (m) return { provider: "Loom", kind: "iframe", src: `https://www.loom.com/embed/${m[1]}`, url, aspect: 16 / 9, title: "Loom video", allow: VIDEO_ALLOW };
  }
  if (host === "dailymotion.com" || host === "dai.ly") {
    const m = path.match(/(?:video\/|^\/)([a-z0-9]{5,10})/i);
    if (m) return { provider: "Dailymotion", kind: "iframe", src: `https://www.dailymotion.com/embed/video/${m[1]}`, url, aspect: 16 / 9, title: "Dailymotion video", allow: VIDEO_ALLOW };
  }
  if (host === "twitch.tv" || host === "clips.twitch.tv") {
    const clip = host === "clips.twitch.tv" ? path.slice(1) : path.match(/\/clip\/([\w-]+)/)?.[1];
    const vid = path.match(/\/videos\/(\d+)/)?.[1];
    const channel = !clip && !vid ? id(path.split("/")[1], /^[a-zA-Z0-9_]{3,25}$/) : null;
    const q = clip ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip)}` : vid ? `https://player.twitch.tv/?video=${vid}` : channel ? `https://player.twitch.tv/?channel=${channel}` : null;
    if (q) return { provider: "Twitch", kind: "iframe", src: q, url, aspect: 16 / 9, title: "Twitch", allow: VIDEO_ALLOW, needsParent: true };
  }
  if (host === "tiktok.com") {
    const m = path.match(/\/video\/(\d{10,25})/);
    if (m) return { provider: "TikTok", kind: "iframe", src: `https://www.tiktok.com/embed/v2/${m[1]}`, url, aspect: 9 / 16, title: "TikTok video", allow: VIDEO_ALLOW };
  }
  if (host === "ted.com") {
    const m = path.match(/\/talks\/([\w-]+)/);
    if (m) return { provider: "TED", kind: "iframe", src: `https://embed.ted.com/talks/${m[1]}`, url, aspect: 16 / 9, title: "TED talk", allow: VIDEO_ALLOW };
  }

  // ── Social ──
  if (host === "twitter.com" || host === "x.com" || host === "mobile.twitter.com") {
    const m = path.match(/\/status(?:es)?\/(\d{5,25})/);
    if (m) return { provider: "X", kind: "iframe", src: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&dnt=true`, url, height: 560, title: "Post on X" };
  }
  if (host === "reddit.com" || host === "old.reddit.com" || host === "new.reddit.com") {
    const m = path.match(/^\/r\/([\w]{2,21})\/comments\/([a-z0-9]{4,10})(?:\/([\w-]*))?/i);
    if (m) return { provider: "Reddit", kind: "iframe", src: `https://embed.reddit.com/r/${m[1]}/comments/${m[2]}/${m[3] ?? ""}?embed=true&theme=auto&showmedia=true`, url, height: 520, title: "Reddit post" };
  }
  if (host === "instagram.com") {
    const m = path.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]{5,20})/);
    if (m) return { provider: "Instagram", kind: "iframe", src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, url, height: 640, title: "Instagram post" };
  }
  if (host === "linkedin.com") {
    const m = path.match(/(urn:li:(?:activity|share|ugcPost):\d+)/) ?? url.match(/activity-(\d{10,25})/);
    const urn = m ? (m[1].startsWith("urn") ? m[1] : `urn:li:activity:${m[1]}`) : null;
    if (urn) return { provider: "LinkedIn", kind: "iframe", src: `https://www.linkedin.com/embed/feed/update/${urn}`, url, height: 560, title: "LinkedIn post" };
  }

  // ── Code ──
  if (host === "codepen.io") {
    const m = path.match(/^\/([\w-]+)\/(?:pen|full|details|embed)\/([A-Za-z0-9]{4,12})/);
    if (m) return { provider: "CodePen", kind: "iframe", src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result&theme-id=dark`, url, height: 460, title: "CodePen" };
  }
  if (host === "codesandbox.io") {
    const m = path.match(/^\/(?:s|p\/sandbox|embed)\/([\w-]{4,40})/);
    if (m) return { provider: "CodeSandbox", kind: "iframe", src: `https://codesandbox.io/embed/${m[1]}?view=split`, url, height: 500, title: "CodeSandbox" };
  }
  if (host === "stackblitz.com") {
    const m = path.match(/^\/(edit|github)\/(.+)$/);
    if (m) return { provider: "StackBlitz", kind: "iframe", src: `https://stackblitz.com/${m[1]}/${m[2]}?embed=1&view=preview`, url, height: 500, title: "StackBlitz" };
  }
  if (host === "jsfiddle.net") {
    const p = path.replace(/\/embedded.*$/, "").replace(/\/$/, "");
    if (/^\/[\w/]+$/.test(p)) return { provider: "JSFiddle", kind: "iframe", src: `https://jsfiddle.net${p}/embedded/result,js,html,css/dark/`, url, height: 420, title: "JSFiddle" };
  }
  if (host === "replit.com") {
    if (/^\/@[\w-]+\/[\w-]+/.test(path)) return { provider: "Replit", kind: "iframe", src: `https://replit.com${path}?embed=true`, url, height: 500, title: "Replit" };
  }
  if (host === "gist.github.com") {
    const m = path.match(/^\/([\w-]+)\/([a-f0-9]{8,40})/);
    if (m) return { provider: "GitHub Gist", kind: "gist", src: `https://gist.github.com/${m[1]}/${m[2]}.js`, url, height: 360, title: "GitHub Gist" };
  }
  if (host === "observablehq.com") {
    const m = path.match(/^\/(@[\w-]+\/[\w-]+)/);
    if (m) return { provider: "Observable", kind: "iframe", src: `https://observablehq.com/embed/${m[1]}`, url, height: 480, title: "Observable notebook" };
  }

  // ── Design, docs, tools ──
  if (host === "figma.com" && /^\/(file|design|proto|board)\//.test(path)) {
    return { provider: "Figma", kind: "iframe", src: `https://www.figma.com/embed?embed_host=campusloop&url=${encodeURIComponent(url)}`, url, aspect: 16 / 10, title: "Figma" };
  }
  if (host === "docs.google.com") {
    const m = path.match(/^\/(document|presentation|spreadsheets|forms)\/d\/(e\/)?([\w-]{20,80})/);
    if (m) {
      const [, kind, pub, docId] = m;
      const base = `https://docs.google.com/${kind}/d/${pub ?? ""}${docId}`;
      const src =
        kind === "presentation" ? `${base}/embed` : kind === "forms" ? `${base}/viewform?embedded=true` : kind === "spreadsheets" ? `${base}/${pub ? "pubhtml?widget=true" : "preview"}` : `${base}/preview`;
      return { provider: "Google " + { document: "Docs", presentation: "Slides", spreadsheets: "Sheets", forms: "Forms" }[kind], kind: "iframe", src, url, aspect: kind === "presentation" ? 16 / 9.5 : undefined, height: kind === "presentation" ? undefined : 600, title: "Google document" };
    }
  }
  if (host === "drive.google.com") {
    const m = path.match(/\/file\/d\/([\w-]{20,80})/);
    if (m) return { provider: "Google Drive", kind: "iframe", src: `https://drive.google.com/file/d/${m[1]}/preview`, url, height: 560, title: "Google Drive file" };
  }
  if ((host === "google.com" || host === "maps.google.com") && path.startsWith("/maps")) {
    const q = u.searchParams.get("q") ?? decodeURIComponent(path.match(/\/maps\/(?:place|search)\/([^/]+)/)?.[1] ?? "").replace(/\+/g, " ");
    if (q) return { provider: "Google Maps", kind: "iframe", src: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`, url, height: 380, title: `Map: ${q}` };
  }
  if (host === "desmos.com") {
    const m = path.match(/^\/(calculator|geometry|3d)\/([a-z0-9]{6,20})/);
    if (m) return { provider: "Desmos", kind: "iframe", src: `https://www.desmos.com/${m[1]}/${m[2]}?embed`, url, height: 460, title: "Desmos graph" };
  }
  if (host === "geogebra.org") {
    const m = path.match(/\/(?:m|calculator|classic|graphing)\/([a-z0-9]{6,12})/i);
    if (m) return { provider: "GeoGebra", kind: "iframe", src: `https://www.geogebra.org/material/iframe/id/${m[1]}`, url, height: 480, title: "GeoGebra" };
  }
  if (host === "miro.com") {
    const m = path.match(/\/app\/board\/([\w=-]+)/);
    if (m) return { provider: "Miro", kind: "iframe", src: `https://miro.com/app/live-embed/${m[1]}/`, url, aspect: 16 / 10, title: "Miro board" };
  }
  if (host === "canva.com" && /\/design\/[\w-]+\/[\w-]+\/view/.test(path)) {
    return { provider: "Canva", kind: "iframe", src: `${u.origin}${path}?embed`, url, aspect: 16 / 9, title: "Canva design" };
  }
  if (host === "calendly.com") {
    return { provider: "Calendly", kind: "iframe", src: `https://calendly.com${path}`, url, height: 660, title: "Calendly" };
  }
  if (host.endsWith("typeform.com") && path.startsWith("/to/")) {
    return { provider: "Typeform", kind: "iframe", src: url, url, height: 520, title: "Typeform" };
  }

  // ── Audio ──
  if (host === "open.spotify.com") {
    const m = path.match(/^\/(?:intl-\w+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{10,30})/);
    if (m) return { provider: "Spotify", kind: "iframe", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, url, height: m[1] === "track" || m[1] === "episode" ? 152 : 380, title: "Spotify", allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" };
  }
  if (host === "soundcloud.com") {
    return { provider: "SoundCloud", kind: "iframe", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`, url, height: 166, title: "SoundCloud", allow: "autoplay" };
  }
  if (host === "music.apple.com" || host === "podcasts.apple.com") {
    return { provider: "Apple", kind: "iframe", src: `https://embed.${host}${path}${u.search}`, url, height: 175, title: "Apple Music", allow: "autoplay *; encrypted-media *;" };
  }

  // ── Direct files ──
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return { provider: "Video", kind: "video", src: url, url, aspect: 16 / 9, title: "Video" };
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return { provider: "Audio", kind: "audio", src: url, url, height: 56, title: "Audio" };
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(ext)) return { provider: "Image", kind: "image", src: url, url, title: "Image" };
  if (ext === "pdf") return { provider: "PDF", kind: "iframe", src: url, url, height: 640, title: "PDF document" };

  // Everything else: a rich link card.
  return { provider: host, kind: "card", src: url, url, title: host };
}

/**
 * The URL when a line is just a link: bare, <angle-bracketed>, or an editor
 * autolink written as [url](url). Otherwise null.
 */
export function standaloneUrl(line: string): string | null {
  const t = line.trim();
  const m = t.match(/^<(https?:\/\/\S+)>$/) ?? t.match(/^\[(https?:\/\/[^\]\s]+)\]\((https?:\/\/[^)\s]+)\)$/);
  if (m) return m[2] === undefined || m[1] === m[2] ? m[1] : null;
  return /^https?:\/\/\S+$/.test(t) ? t : null;
}

/** True when a line should auto-embed: a supported link alone on its own line. */
export function isStandaloneEmbedLine(line: string): boolean {
  const url = standaloneUrl(line);
  return url !== null && resolveArticleEmbed(url)?.kind !== "card";
}

export const EMBED_PROVIDERS = [
  "YouTube (videos, Shorts, playlists, start time)",
  "Vimeo",
  "Loom",
  "Dailymotion",
  "Twitch (channels, videos, clips)",
  "TikTok",
  "TED",
  "X / Twitter posts",
  "Reddit posts",
  "Instagram posts and reels",
  "LinkedIn posts",
  "CodePen",
  "CodeSandbox",
  "StackBlitz",
  "JSFiddle",
  "Replit",
  "GitHub Gist",
  "Observable",
  "Figma",
  "Google Docs, Slides, Sheets, Forms, Drive",
  "Google Maps",
  "Desmos",
  "GeoGebra",
  "Miro",
  "Canva",
  "Calendly",
  "Typeform",
  "Spotify",
  "SoundCloud",
  "Apple Music and Podcasts",
  "MP4/WebM video, MP3 audio, images, PDFs",
  "Any other link: a preview card",
];

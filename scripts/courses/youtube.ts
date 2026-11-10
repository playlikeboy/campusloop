/**
 * Minimal YouTube reader for course importers: public channel playlist tabs
 * and playlist contents, following "load more" continuations through the same
 * innertube endpoint the website uses. No API key needed.
 */

const UA = { "User-Agent": "Mozilla/5.0 (CampusLoop course importer)", "Accept-Language": "en-US,en" };
const CLIENT = { clientName: "WEB", clientVersion: "2.20250101.00.00", hl: "en", gl: "IN" };

export interface YtVideo {
  videoId: string;
  title: string;
  durationSec: number;
  /** The owner disabled embedding: the lecture opens on YouTube instead of in our player. */
  external?: boolean;
}

export interface YtPlaylist {
  id: string;
  title: string;
  videoCount: number;
  channel?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getText(url: string): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: UA, redirect: "follow" });
    if (res.ok) return res.text();
    await sleep(1000 * (attempt + 1));
  }
  throw new Error(`GET ${url} failed`);
}

/** ytInitialData from a YouTube page (retries: the blob is sometimes missing). */
export async function initialData(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const html = await getText(url);
    const raw = html.match(/(?:var ytInitialData|window\["ytInitialData"\]) = (\{.*?\});<\/script>/)?.[1];
    if (raw) return JSON.parse(raw);
    await sleep(1500 * (attempt + 1));
  }
  throw new Error(`no ytInitialData at ${url}`);
}

async function continuation(token: string, endpoint: "browse" | "search"): Promise<unknown> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({ context: { client: CLIENT }, continuation: token }),
    });
    if (res.ok) return res.json();
    await sleep(1000 * (attempt + 1));
  }
  throw new Error("continuation failed");
}

function walk(o: unknown, visit: (k: string, v: unknown) => void) {
  if (Array.isArray(o)) for (const v of o) walk(v, visit);
  else if (o && typeof o === "object")
    for (const [k, v] of Object.entries(o)) {
      visit(k, v);
      walk(v, visit);
    }
}

const textOf = (t: unknown): string => {
  if (!t || typeof t !== "object") return "";
  const r = t as { simpleText?: string; content?: string; runs?: { text: string }[] };
  return r.simpleText ?? r.content ?? r.runs?.map((x) => x.text).join("") ?? "";
};

function toSeconds(badge: string): number {
  if (!/^\d{1,2}(:\d{2}){1,2}$/.test(badge)) return 0;
  return badge.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
}

/**
 * Candidate "load more" tokens, best first: those inside a continuationItemRenderer,
 * then any other continuation command (playlist pages nest it elsewhere; sort menus
 * carry tokens too, which is why callers try them until one yields new items).
 */
function nextTokens(o: unknown): string[] {
  const preferred: string[] = [];
  const rest: string[] = [];
  walk(o, (k, v) => {
    if (k === "continuationItemRenderer")
      walk(v, (kk, vv) => {
        if (kk === "continuationCommand") preferred.push((vv as { token?: string }).token ?? "");
      });
    if (k === "continuationCommand") rest.push((v as { token?: string }).token ?? "");
  });
  return [...new Set([...preferred, ...rest].filter(Boolean))];
}

/** Collects items page by page until there is no continuation or `max` is reached. */
async function paginate<T>(first: unknown, extract: (page: unknown) => T[], key: (t: T) => string, max: number, endpoint: "browse" | "search" = "browse"): Promise<T[]> {
  const out = new Map<string, T>();
  const used = new Set<string>();
  let page: unknown = first;
  for (let i = 0; i < 40 && page; i++) {
    for (const item of extract(page)) if (!out.has(key(item))) out.set(key(item), item);
    if (out.size >= max) break;
    let next: unknown = null;
    for (const token of nextTokens(page).filter((t) => !used.has(t))) {
      used.add(token);
      const candidate = await continuation(token, endpoint).catch(() => null);
      if (candidate && extract(candidate).some((item) => !out.has(key(item)))) {
        next = candidate;
        break;
      }
    }
    page = next;
  }
  return [...out.values()].slice(0, max);
}

function extractVideos(page: unknown): YtVideo[] {
  const vids: YtVideo[] = [];
  walk(page, (k, v) => {
    if (k === "playlistVideoRenderer") {
      const r = v as { videoId?: string; title?: unknown; lengthSeconds?: string; isPlayable?: boolean };
      const durationSec = Number(r.lengthSeconds ?? 0);
      if (r.videoId && durationSec > 0 && r.isPlayable !== false) vids.push({ videoId: r.videoId, title: textOf(r.title), durationSec });
    }
    if (k === "lockupViewModel") {
      const r = v as Record<string, unknown>;
      if (r.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO" || typeof r.contentId !== "string") return;
      let title = "";
      let durationSec = 0;
      walk(r, (kk, vv) => {
        if (!title && kk === "title") title = textOf(vv);
        if (!durationSec && kk === "thumbnailBadgeViewModel") durationSec = toSeconds((vv as { text?: string }).text ?? "");
      });
      if (title && durationSec) vids.push({ videoId: r.contentId, title, durationSec });
    }
  });
  return vids;
}

/** Playable videos of a playlist, in order. Private, deleted and live/upcoming items are dropped. */
export async function playlistVideos(listId: string, max = 400): Promise<{ title: string; channel: string; description: string; videos: YtVideo[] }> {
  const data = await initialData(`https://www.youtube.com/playlist?list=${listId}&hl=en`);
  let title = "";
  let channel = "";
  let description = "";
  walk(data, (k, v) => {
    if (k === "playlistMetadataRenderer") {
      const r = v as { title?: string; description?: string };
      title ||= r.title ?? "";
      description ||= r.description ?? "";
    }
    if (k === "pageHeaderViewModel" && !title) title = textOf((v as { title?: { dynamicTextViewModel?: { text?: unknown } } }).title?.dynamicTextViewModel?.text);
    if (k === "ownerText" && !channel) channel = textOf(v);
    if (k === "videoOwnerRenderer" && !channel) channel = textOf((v as { title?: unknown }).title);
  });
  const videos = await paginate(data, extractVideos, (x) => x.videoId, max);
  return { title, channel, description, videos: videos.filter((x) => !/\b(teaser|trailer)\b/i.test(x.title)) };
}

function extractPlaylists(page: unknown): YtPlaylist[] {
  const lists: YtPlaylist[] = [];
  walk(page, (k, v) => {
    if (k !== "lockupViewModel") return;
    const r = v as Record<string, unknown>;
    // Playlists come back as PLAYLIST or PODCAST lockups depending on channel settings.
    if (typeof r.contentId !== "string" || !/^(PL|OL)/.test(r.contentId) || r.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") return;
    let title = "";
    let videoCount = 0;
    let channel = "";
    walk(r, (kk, vv) => {
      if (!title && kk === "title") title = textOf(vv);
      if (!videoCount && kk === "thumbnailBadgeViewModel") videoCount = Number(((vv as { text?: string }).text ?? "").match(/(\d[\d,]*)\s+(?:videos|lessons)/i)?.[1]?.replace(/,/g, "") ?? 0);
      // First metadata row of a search result is the channel name.
      if (!channel && kk === "metadataParts") channel = textOf((vv as { text?: unknown }[])[0]?.text);
    });
    lists.push({ id: r.contentId, title, videoCount, channel });
  });
  return lists;
}

/** Every public playlist on a channel's Playlists tab. `handle` like "@CodeWithHarry". */
export async function channelPlaylists(handle: string, max = 300): Promise<YtPlaylist[]> {
  const data = await initialData(`https://www.youtube.com/${handle}/playlists?view=1&sort=dd&flow=grid&hl=en`);
  return paginate(data, extractPlaylists, (p) => p.id, max);
}

/** Playlist search results (YouTube's own "Playlists" filter). */
export async function searchPlaylists(query: string, max = 40): Promise<YtPlaylist[]> {
  const data = await initialData(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D&hl=en`);
  return paginate(data, extractPlaylists, (p) => p.id, max, "search");
}

/**
 * oEmbed tells embeddable (200), embedding disabled by the owner (401) and
 * private/removed (404/400) apart. Retries transient errors.
 */
export async function videoStatus(videoId: string): Promise<"embed" | "external" | "gone"> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`, { headers: UA });
    if (res.ok) return "embed";
    if (res.status === 401 || res.status === 403) return "external";
    if (res.status === 404 || res.status === 400) return "gone";
    await sleep(800 * (attempt + 1));
  }
  return "gone";
}

/** Cheap availability check for a single video. */
export async function videoAvailable(videoId: string): Promise<boolean> {
  return (await videoStatus(videoId)) === "embed";
}

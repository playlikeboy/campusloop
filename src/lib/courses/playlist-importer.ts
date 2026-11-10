/**
 * Multi-Platform Playlist Importer for CampusLoop Course Builder.
 * Supports YouTube playlists, Dailymotion playlists, Archive.org collections/items,
 * and Google Drive folders / public files.
 * Zero external credentials required for public YouTube, Dailymotion, and Archive.org.
 * Optional COMPOSIO_API_KEY / GOOGLE_DRIVE_API_KEY used for enhanced Google Drive folder imports.
 */

import { COURSE_CATEGORIES, type CourseLevel, parseVideoUrl } from "./format";
import type { CourseInput, LectureInput, SectionInput } from "./validate";

export type PlaylistPlatform = "youtube" | "dailymotion" | "archiveorg" | "drive" | "links";

export interface ImportedVideoItem {
  title: string;
  url: string;
  durationSec: number;
  thumbnailUrl?: string;
  description?: string;
}

export interface ImportedPlaylistResult {
  platform: PlaylistPlatform;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  level: CourseLevel;
  thumbnailUrl: string;
  instructorName: string;
  outcomes: string[];
  requirements: string[];
  tags: string[];
  sections: SectionInput[];
  itemCount: number;
}

const UA = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CampusLoop/2.0",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Categorize text into one of the official COURSE_CATEGORIES */
export function inferCourseCategory(text: string): string {
  const t = text.toLowerCase();

  // Computing & Tech
  if (/\b(dsa|algorithm|data structures|leetcode|sorting|graph|tree|dynamic programming)\b/.test(t)) return "Computer Science";
  if (/\b(ai|artificial intelligence|machine learning|deep learning|neural network|llm|nlp|pytorch|tensorflow)\b/.test(t)) return "Artificial Intelligence";
  if (/\b(data science|pandas|numpy|data analytics|power bi|tableau|statistics for data)\b/.test(t)) return "Data Science";
  if (/\b(database|sql|dbms|mongodb|postgresql|mysql|nosql|redis)\b/.test(t)) return "Databases";
  if (/\b(security|cybersecurity|ethical hacking|penetration|cryptography|infosec)\b/.test(t)) return "Cybersecurity";
  if (/\b(system design|microservices|distributed systems|scalability|high availability)\b/.test(t)) return "System Design";
  if (/\b(devops|docker|kubernetes|aws|cloud|ci\/cd|terraform|linux)\b/.test(t)) return "DevOps & Cloud";
  if (/\b(web development|react|next\.?js|html|css|javascript|typescript|nodejs|tailwind|frontend|fullstack)\b/.test(t)) return "Web Development";
  if (/\b(mobile|flutter|react native|android|ios|swift|kotlin)\b/.test(t)) return "Mobile Development";
  if (/\b(python|java|c\+\+|golang|rust|programming in|coding in)\b/.test(t)) return "Programming";

  // Engineering
  if (/\b(electronics|vlsi|digital electronics|analog|signals? and systems?|dsp|verilog|embedded)\b/.test(t)) return "Electronics & Communication";
  if (/\b(electrical|power systems?|transformers?|machines|circuit theory|control systems?)\b/.test(t)) return "Electrical Engineering";
  if (/\b(mechanical|thermodynamics|fluid mechanics|strength of materials|heat transfer|cad|solidworks)\b/.test(t)) return "Mechanical Engineering";
  if (/\b(civil|structures|surveying|concrete|geotechnical|construction)\b/.test(t)) return "Civil Engineering";
  if (/\b(biotechnology|bioinformatics|genetics|molecular biology)\b/.test(t)) return "Biotechnology";

  // Science & Maths
  if (/\b(calculus|linear algebra|discrete math|probability|differential equations?|vector algebra)\b/.test(t)) return "Mathematics";
  if (/\b(physics|quantum|electromagnetism|mechanics|optics|relativity)\b/.test(t)) return "Physics";
  if (/\b(chemistry|organic chemistry|inorganic|chemical engineering)\b/.test(t)) return "Chemistry";

  // Business & Finance
  if (/\b(finance|accounting|financial accounting|investing|balance sheet|equity|banking)\b/.test(t)) return "Finance & Accounting";
  if (/\b(economics|microeconomics|macroeconomics|econometrics|gdp|monetary policy)\b/.test(t)) return "Economics";
  if (/\b(marketing|seo|brand strategy|social media marketing|growth)\b/.test(t)) return "Marketing";
  if (/\b(startup|entrepreneurship|venture capital|business model|product management)\b/.test(t)) return "Entrepreneurship";
  if (/\b(management|mba|business analytics|consulting|organizational behavior)\b/.test(t)) return "Business";

  // Health, Law, Design
  if (/\b(medicine|anatomy|physiology|pathology|pharmacology|clinical|surgery)\b/.test(t)) return "Medicine";
  if (/\b(law|constitution|jurisprudence|contracts|legal rights|intellectual property)\b/.test(t)) return "Law & Policy";
  if (/\b(ui\/ux|design|figma|graphic design|typography|wireframing|user experience)\b/.test(t)) return "Design";

  return "General";
}

/** Detect platform from URL */
export function detectPlatform(input: string): PlaylistPlatform | null {
  const trimmed = input.trim();
  if (trimmed.includes("\n") || trimmed.includes(",")) return "links";
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") return "youtube";
    if (host === "dailymotion.com" || host === "dai.ly") return "dailymotion";
    if (host === "archive.org") return "archiveorg";
    if (host === "drive.google.com") return "drive";
  } catch {
    // If not a valid full URL, inspect raw string
  }
  if (input.includes("youtube.com") || input.includes("youtu.be")) return "youtube";
  if (input.includes("dailymotion.com") || input.includes("dai.ly")) return "dailymotion";
  if (input.includes("archive.org")) return "archiveorg";
  if (input.includes("drive.google.com")) return "drive";
  return null;
}

/** Extract clean tags from title & description */
function extractTags(title: string, desc: string, category: string): string[] {
  const set = new Set<string>();
  set.add(category.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
  const words = `${title} ${desc}`.toLowerCase().match(/\b[a-z]{3,15}\b/g) || [];
  const stopwords = new Set(["this", "that", "with", "from", "your", "course", "video", "lecture", "tutorial", "learn", "introduction", "about"]);
  for (const w of words) {
    if (!stopwords.has(w) && w.length >= 4 && set.size < 6) {
      set.add(w);
    }
  }
  return [...set].slice(0, 8);
}

/** Divide a flat list of lectures into structured sections */
function organizeSections(items: ImportedVideoItem[]): SectionInput[] {
  if (items.length <= 16) {
    return [
      {
        title: "Course Curriculum",
        lectures: items.map((it) => ({
          title: it.title || "Lecture",
          kind: "VIDEO" as const,
          videoUrl: it.url,
          durationMin: Math.max(1, Math.round(it.durationSec / 60)),
        })),
      },
    ];
  }

  // Check if titles already contain chapter / module cues
  const hasModule = items.some((it) => /\b(module|unit|chapter|part|section|week)\s*\d+/i.test(it.title));
  if (hasModule) {
    const sectionMap = new Map<string, LectureInput[]>();
    for (const it of items) {
      const match = it.title.match(/\b(Module|Unit|Chapter|Part|Section|Week)\s*(\d+)/i);
      const secName = match ? `${match[1]} ${match[2]}` : "Core Curriculum";
      if (!sectionMap.has(secName)) sectionMap.set(secName, []);
      sectionMap.get(secName)!.push({
        title: it.title,
        kind: "VIDEO" as const,
        videoUrl: it.url,
        durationMin: Math.max(1, Math.round(it.durationSec / 60)),
      });
    }
    return Array.from(sectionMap.entries()).map(([secTitle, lecs]) => ({
      title: secTitle,
      lectures: lecs,
    }));
  }

  // Otherwise, group by chunks of 10-12 lectures
  const chunkSize = items.length > 50 ? 15 : 10;
  const sections: SectionInput[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const secIndex = Math.floor(i / chunkSize) + 1;
    sections.push({
      title: `Part ${secIndex}: ${chunk[0]?.title.slice(0, 40) || `Lectures ${i + 1}-${i + chunk.length}`}`,
      lectures: chunk.map((it) => ({
        title: it.title,
        kind: "VIDEO" as const,
        videoUrl: it.url,
        durationMin: Math.max(1, Math.round(it.durationSec / 60)),
      })),
    });
  }
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. YouTube Importer
// ─────────────────────────────────────────────────────────────────────────────

function walkJson(o: unknown, visit: (k: string, v: unknown) => void) {
  if (Array.isArray(o)) for (const v of o) walkJson(v, visit);
  else if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      visit(k, v);
      walkJson(v, visit);
    }
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

export async function importYouTube(rawUrl: string): Promise<ImportedPlaylistResult> {
  let listId = "";
  try {
    const u = new URL(rawUrl.trim());
    listId = u.searchParams.get("list") || "";
  } catch {
    const m = rawUrl.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (m) listId = m[1];
  }

  if (!listId) {
    // Single YouTube video fallback
    const single = parseVideoUrl(rawUrl);
    if (single?.provider === "youtube") {
      return {
        platform: "youtube",
        title: "YouTube Video Lecture",
        subtitle: "Single video imported into course",
        description: "Imported lecture from YouTube.",
        category: "General",
        level: "ALL",
        thumbnailUrl: `https://i.ytimg.com/vi/${single.ref}/hqdefault.jpg`,
        instructorName: "Instructor",
        outcomes: ["Complete this core video lecture"],
        requirements: ["Curiosity to learn"],
        tags: ["youtube", "lecture"],
        sections: [
          {
            title: "Course Curriculum",
            lectures: [{ title: "Lecture 1", kind: "VIDEO", videoUrl: `https://youtu.be/${single.ref}`, durationMin: 15 }],
          },
        ],
        itemCount: 1,
      };
    }
    throw new Error("No playlist ID ('list=...') found in this YouTube URL.");
  }

  const res = await fetch(`https://www.youtube.com/playlist?list=${listId}&hl=en`, {
    headers: UA,
  });
  if (!res.ok) {
    throw new Error(`YouTube returned status ${res.status}. Check if the playlist is unlisted or public.`);
  }

  const html = await res.text();
  const rawData = html.match(/(?:var ytInitialData|window\["ytInitialData"\]) = (\{.*?\});<\/script>/)?.[1];
  if (!rawData) {
    throw new Error("Could not parse YouTube playlist metadata. Make sure the playlist is public.");
  }

  const data = JSON.parse(rawData);
  let title = "";
  let channel = "";
  let description = "";

  walkJson(data, (k, v) => {
    if (k === "playlistMetadataRenderer") {
      const r = v as { title?: string; description?: string };
      title ||= r.title ?? "";
      description ||= r.description ?? "";
    }
    if (k === "pageHeaderViewModel" && !title) {
      title = textOf((v as { title?: { dynamicTextViewModel?: { text?: unknown } } }).title?.dynamicTextViewModel?.text);
    }
    if (k === "ownerText" && !channel) channel = textOf(v);
    if (k === "videoOwnerRenderer" && !channel) channel = textOf((v as { title?: unknown }).title);
  });

  const videos: ImportedVideoItem[] = [];
  walkJson(data, (k, v) => {
    if (k === "playlistVideoRenderer") {
      const r = v as { videoId?: string; title?: unknown; lengthSeconds?: string; isPlayable?: boolean };
      const durationSec = Number(r.lengthSeconds ?? 0);
      if (r.videoId && r.isPlayable !== false) {
        videos.push({
          title: textOf(r.title) || `Lecture ${videos.length + 1}`,
          url: `https://youtu.be/${r.videoId}`,
          durationSec: durationSec > 0 ? durationSec : 600,
          thumbnailUrl: `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`,
        });
      }
    }
    if (k === "lockupViewModel") {
      const r = v as Record<string, unknown>;
      if (r.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO" || typeof r.contentId !== "string") return;
      let vidTitle = "";
      let durSec = 0;
      walkJson(r, (kk, vv) => {
        if (!vidTitle && kk === "title") vidTitle = textOf(vv);
        if (!durSec && kk === "thumbnailBadgeViewModel") durSec = toSeconds((vv as { text?: string }).text ?? "");
      });
      if (vidTitle && r.contentId) {
        videos.push({
          title: vidTitle,
          url: `https://youtu.be/${r.contentId}`,
          durationSec: durSec > 0 ? durSec : 600,
          thumbnailUrl: `https://i.ytimg.com/vi/${r.contentId}/hqdefault.jpg`,
        });
      }
    }
  });

  if (!videos.length) {
    throw new Error("No playable videos found in this YouTube playlist.");
  }

  const category = inferCourseCategory(`${title} ${description}`);
  const outcomes = [
    `Master all ${videos.length} lectures in this structured series`,
    `Understand core concepts of ${title || category}`,
    "Build practical problem-solving confidence",
  ];

  return {
    platform: "youtube",
    title: title || "Imported YouTube Course",
    subtitle: `Complete playlist series by ${channel || "Instructor"} (${videos.length} lectures)`,
    description: description || `Full curriculum covering ${title || category}. Imported from official YouTube playlist.`,
    category,
    level: "ALL",
    thumbnailUrl: videos[0]?.thumbnailUrl || "",
    instructorName: channel || "Instructor",
    outcomes,
    requirements: ["Basic computer access", "Enthusiasm to learn"],
    tags: extractTags(title, description, category),
    sections: organizeSections(videos),
    itemCount: videos.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dailymotion Importer
// ─────────────────────────────────────────────────────────────────────────────

export async function importDailymotion(rawUrl: string): Promise<ImportedPlaylistResult> {
  let plId = "";
  const match = rawUrl.match(/\/playlist\/([A-Za-z0-9]+)/);
  if (match) {
    plId = match[1];
  } else {
    const single = parseVideoUrl(rawUrl);
    if (single?.provider === "dailymotion") {
      return {
        platform: "dailymotion",
        title: "Dailymotion Video Lecture",
        subtitle: "Single video lecture imported into course",
        description: "Imported lecture from Dailymotion.",
        category: "General",
        level: "ALL",
        thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${single.ref}`,
        instructorName: "Dailymotion Creator",
        outcomes: ["Complete this core video lecture"],
        requirements: ["Curiosity to learn"],
        tags: ["dailymotion", "lecture"],
        sections: [
          {
            title: "Course Curriculum",
            lectures: [{ title: "Lecture 1", kind: "VIDEO", videoUrl: `https://www.dailymotion.com/video/${single.ref}`, durationMin: 15 }],
          },
        ],
        itemCount: 1,
      };
    }
    throw new Error("No playlist ID ('/playlist/{id}') found in this Dailymotion URL.");
  }

  // 1. Fetch playlist metadata
  const metaRes = await fetch(`https://api.dailymotion.com/playlist/${plId}?fields=id,name,description,thumbnail_720_url,owner.screenname,videos_total`, {
    headers: UA,
  });
  if (!metaRes.ok) {
    throw new Error(`Dailymotion playlist returned HTTP ${metaRes.status}. Check if the playlist ID is correct.`);
  }
  const meta = (await metaRes.json()) as any;

  // 2. Fetch playlist videos
  const vidsRes = await fetch(`https://api.dailymotion.com/playlist/${plId}/videos?fields=id,title,duration,thumbnail_720_url&limit=100`, {
    headers: UA,
  });
  if (!vidsRes.ok) {
    throw new Error(`Failed to fetch videos from Dailymotion playlist (HTTP ${vidsRes.status}).`);
  }
  const vidsData = (await vidsRes.json()) as any;
  const list = vidsData.list || [];

  if (!list.length) {
    throw new Error("No videos found in this Dailymotion playlist.");
  }

  const videos: ImportedVideoItem[] = list.map((v: any, idx: number) => ({
    title: v.title || `Lecture ${idx + 1}`,
    url: `https://www.dailymotion.com/video/${v.id}`,
    durationSec: Number(v.duration) || 600,
    thumbnailUrl: v.thumbnail_720_url,
  }));

  const category = inferCourseCategory(`${meta.name || ""} ${meta.description || ""}`);

  return {
    platform: "dailymotion",
    title: meta.name || "Dailymotion Course",
    subtitle: `Curated playlist by ${meta["owner.screenname"] || "Creator"} (${videos.length} videos)`,
    description: meta.description || `Comprehensive playlist of ${videos.length} lectures on ${meta.name || category}.`,
    category,
    level: "ALL",
    thumbnailUrl: meta.thumbnail_720_url || videos[0]?.thumbnailUrl || "",
    instructorName: meta["owner.screenname"] || "Dailymotion Creator",
    outcomes: [`Master all concepts covered across ${videos.length} lectures`, "Apply knowledge through practical video exercises"],
    requirements: ["Basic understanding of the subject"],
    tags: extractTags(meta.name || "", meta.description || "", category),
    sections: organizeSections(videos),
    itemCount: videos.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Archive.org Importer
// ─────────────────────────────────────────────────────────────────────────────

export async function importArchiveOrg(rawUrl: string): Promise<ImportedPlaylistResult> {
  const m = rawUrl.match(/(?:details|metadata|download)\/([^/?#]+)/);
  const identifier = m ? m[1] : rawUrl.trim().split("/").filter(Boolean).pop();
  if (!identifier) {
    throw new Error("Could not find an Archive.org identifier in this URL (e.g. 'https://archive.org/details/{identifier}').");
  }

  const res = await fetch(`https://archive.org/metadata/${identifier}`, { headers: UA });
  if (!res.ok) {
    throw new Error(`Archive.org metadata returned HTTP ${res.status}. Check the identifier.`);
  }

  const data = (await res.json()) as any;
  const meta = data.metadata || {};
  const files: any[] = data.files || [];

  // Filter video files (prefer MP4 / MPEG4; exclude tiny thumbnails or derivatives)
  const videoFiles = files.filter((f) => {
    const name = (f.name || "").toLowerCase();
    if (name.includes("_thumb") || name.endsWith(".ia.mp4") || name.includes("preview")) return false;
    const format = (f.format || "").toLowerCase();
    return format.includes("mpeg4") || format.includes("h.264") || name.endsWith(".mp4") || name.endsWith(".webm");
  });

  if (!videoFiles.length) {
    throw new Error("No MP4 or WebM video files found in this Archive.org item.");
  }

  // Sort files naturally by name so lecture 1, 2, 3 are in sequence
  videoFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  const videos: ImportedVideoItem[] = videoFiles.map((f, idx) => {
    const cleanName = f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const durSec = Math.round(parseFloat(f.length || "0"));
    return {
      title: f.title || cleanName || `Lecture ${idx + 1}`,
      url: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`,
      durationSec: durSec > 0 ? durSec : 1800,
      thumbnailUrl: `https://archive.org/services/img/${identifier}`,
    };
  });

  const category = inferCourseCategory(`${meta.title || ""} ${meta.description || ""}`);

  return {
    platform: "archiveorg",
    title: meta.title || "Archive.org Course Collection",
    subtitle: `${meta.creator || "Open Courseware"} (${videos.length} archived lectures)`,
    description: typeof meta.description === "string" ? meta.description.slice(0, 2000) : `Archived academic lectures on ${meta.title || category}.`,
    category,
    level: "ALL",
    thumbnailUrl: `https://archive.org/services/img/${identifier}`,
    instructorName: meta.creator || "Archive.org Open Courseware",
    outcomes: [`Study historical and foundational material across ${videos.length} lectures`, "Gain in-depth academic understanding"],
    requirements: ["Foundational background in the subject"],
    tags: extractTags(meta.title || "", typeof meta.description === "string" ? meta.description : "", category),
    sections: organizeSections(videos),
    itemCount: videos.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Google Drive Importer (Folder & Files)
// ─────────────────────────────────────────────────────────────────────────────

export async function importGoogleDrive(rawUrl: string): Promise<ImportedPlaylistResult> {
  const folderMatch = rawUrl.match(/\/drive\/(?:u\/\d+\/)?folders\/([\w-]{20,80})/);
  const fileMatch = rawUrl.match(/\/file\/d\/([\w-]{20,80})/);

  // Single file support
  if (fileMatch && !folderMatch) {
    const fileId = fileMatch[1];
    return {
      platform: "drive",
      title: "Google Drive Video Lecture",
      subtitle: "Single video lecture from Google Drive",
      description: "Imported lecture hosted on Google Drive.",
      category: "General",
      level: "ALL",
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      instructorName: "Drive Instructor",
      outcomes: ["Complete this core video lecture"],
      requirements: ["Google account / access if restricted"],
      tags: ["google-drive", "lecture"],
      sections: [
        {
          title: "Course Curriculum",
          lectures: [{ title: "Lecture 1", kind: "VIDEO", videoUrl: `https://drive.google.com/file/d/${fileId}/view`, durationMin: 20 }],
        },
      ],
      itemCount: 1,
    };
  }

  const folderId = folderMatch ? folderMatch[1] : null;
  if (!folderId) {
    throw new Error("Could not find a valid Google Drive folder ID in this URL. Format: 'https://drive.google.com/drive/folders/{folderId}'");
  }

  const foundVideos: ImportedVideoItem[] = [];

  // A. Try Composio if COMPOSIO_API_KEY is configured
  const composioKey = process.env.COMPOSIO_API_KEY;
  if (composioKey) {
    try {
      const compRes = await fetch("https://backend.composio.dev/api/v1/actions/GOOGLEDRIVE_LIST_FILES/execute", {
        method: "POST",
        headers: {
          "x-api-key": composioKey,
          "x-consumer-api-key": composioKey,
          Authorization: `Bearer ${composioKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId, pageSize: 100 }),
      });
      if (compRes.ok) {
        const cData = (await compRes.json()) as any;
        const files = cData.data?.files || cData.files || [];
        for (const f of files) {
          if (f.id && (f.mimeType?.includes("video") || /\.(mp4|webm|mkv|mov|avi)$/i.test(f.name || ""))) {
            foundVideos.push({
              title: f.name || `Lecture ${foundVideos.length + 1}`,
              url: `https://drive.google.com/file/d/${f.id}/view`,
              durationSec: 1800,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Composio Drive import error, falling back]:", e);
    }
  }

  // B. Try Google Drive API key if configured
  const gApiKey = process.env.GOOGLE_DRIVE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!foundVideos.length && gApiKey) {
    try {
      const gRes = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,videoMediaMetadata,size)&pageSize=100&key=${gApiKey}`);
      if (gRes.ok) {
        const gData = (await gRes.json()) as any;
        const files = gData.files || [];
        for (const f of files) {
          if (f.id && (f.mimeType?.includes("video") || /\.(mp4|webm|mkv|mov|avi)$/i.test(f.name || ""))) {
            const durationMs = Number(f.videoMediaMetadata?.durationMillis || 0);
            foundVideos.push({
              title: f.name.replace(/\.[^/.]+$/, ""),
              url: `https://drive.google.com/file/d/${f.id}/view`,
              durationSec: durationMs > 0 ? Math.round(durationMs / 1000) : 1800,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Google Drive API error, falling back]:", e);
    }
  }

  // C. Fallback: Public folder HTML inspection
  if (!foundVideos.length) {
    try {
      const pageRes = await fetch(`https://drive.google.com/drive/folders/${folderId}`, { headers: UA });
      if (pageRes.ok) {
        const html = await pageRes.text();
        // Regex for file entries in Drive HTML JS blobs: ["FILE_ID", "FILENAME.ext"]
        const matches = [...html.matchAll(/\["([a-zA-Z0-9_-]{28,40})","([^"]+\.(?:mp4|webm|mkv|mov|avi))"/gi)];
        const seen = new Set<string>();
        for (const m of matches) {
          const id = m[1];
          const name = m[2];
          if (!seen.has(id)) {
            seen.add(id);
            foundVideos.push({
              title: name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
              url: `https://drive.google.com/file/d/${id}/view`,
              durationSec: 1800,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Google Drive HTML parse error]:", e);
    }
  }

  if (!foundVideos.length) {
    throw new Error(
      "Could not read video files from this Google Drive folder. Please verify the folder permission is set to 'Anyone with the link can view', or paste the individual video link(s)."
    );
  }

  // Natural sort by title
  foundVideos.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" }));

  return {
    platform: "drive",
    title: "Google Drive Course Folder",
    subtitle: `Shared folder with ${foundVideos.length} lecture videos`,
    description: `Complete course collection hosted on Google Drive. Contains ${foundVideos.length} sequential video lectures.`,
    category: "General",
    level: "ALL",
    thumbnailUrl: foundVideos[0] ? `https://drive.google.com/thumbnail?id=${foundVideos[0].url.match(/\/d\/([\w-]{20,80})/)?.[1]}&sz=w800` : "",
    instructorName: "Course Instructor",
    outcomes: [`Complete all ${foundVideos.length} video lectures in this folder`, "Master the subject through comprehensive self-paced study"],
    requirements: ["Drive video access enabled"],
    tags: ["google-drive", "cloud-storage", "lectures"],
    sections: organizeSections(foundVideos),
    itemCount: foundVideos.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Universal Multi-Link Importer (Batch URLs)
// ─────────────────────────────────────────────────────────────────────────────

export function importMultiLinks(rawText: string): ImportedPlaylistResult {
  const lines = rawText
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean);

  const videos: ImportedVideoItem[] = [];
  for (const [idx, line] of lines.entries()) {
    const parsed = parseVideoUrl(line);
    if (parsed) {
      videos.push({
        title: `Lecture ${idx + 1}`,
        url: line,
        durationSec: 1200,
      });
    }
  }

  if (!videos.length) {
    throw new Error("No valid video links found. Please paste valid YouTube, Dailymotion, Google Drive, Archive.org or .mp4 URLs.");
  }

  return {
    platform: "links",
    title: "Custom Imported Video Course",
    subtitle: `Curated collection of ${videos.length} lectures`,
    description: `Custom curriculum assembled from ${videos.length} external video resources.`,
    category: "General",
    level: "ALL",
    thumbnailUrl: "",
    instructorName: "Curator",
    outcomes: [`Complete all ${videos.length} selected video lectures`, "Build a well-rounded understanding of the material"],
    requirements: ["Curiosity to learn"],
    tags: ["curated", "video-course"],
    sections: organizeSections(videos),
    itemCount: videos.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Import Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export async function importPlaylist(rawUrl: string): Promise<ImportedPlaylistResult> {
  const platform = detectPlatform(rawUrl);
  if (!platform) {
    throw new Error("Unsupported URL. Please provide a playlist link from YouTube, Dailymotion, Archive.org, or a Google Drive folder.");
  }

  switch (platform) {
    case "youtube":
      return importYouTube(rawUrl);
    case "dailymotion":
      return importDailymotion(rawUrl);
    case "archiveorg":
      return importArchiveOrg(rawUrl);
    case "drive":
      return importGoogleDrive(rawUrl);
    case "links":
      return importMultiLinks(rawUrl);
  }
}

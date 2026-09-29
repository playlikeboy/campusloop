/**
 * Shared parser for CampusLoop's legacy media attachment markers.
 *
 * Media was historically embedded in post.body as markdown such as:
 *   ![video:Campus Video Clip](/api/files/r2/videos/...)
 *
 * These markers are implementation details and must never be shown as user text.
 */
export type MediaAttachmentType = "image" | "video" | "audio" | "document" | "file";

export interface MediaAttachment {
  type: MediaAttachmentType;
  url: string;
  label?: string;
  size?: number;
}

export interface ParsedMediaContent {
  attachments: MediaAttachment[];
  text: string;
}

const MEDIA_MARKER_REGEX =
  /!\[([^\]]*)\]\(((?:https?:\/\/[^\s)]+|\/api\/files\/r2\/(?:images|videos|audio|documents|files)\/[^\s)]+))\)/gi;

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|ico)(?:\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|mkv|ogg|m3u8)(?:\?.*)?$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|webm)(?:\?.*)?$/i;
const DOCUMENT_EXTENSIONS = /\.(pdf|doc|docx|zip|rar|xls|xlsx|ppt|pptx)(?:\?.*)?$/i;

function pathFromUrl(url: string): string {
  try {
    return new URL(url, "https://campusloop.space").pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function isCampusLoopMediaUrl(url: string): boolean {
  const path = pathFromUrl(url);
  return (
    path.startsWith("/api/files/r2/images/") ||
    path.startsWith("/api/files/r2/videos/") ||
    path.startsWith("/api/files/r2/audio/") ||
    path.startsWith("/api/files/r2/documents/") ||
    path.startsWith("/api/files/r2/files/")
  );
}

export function classifyMediaAttachment(url: string, rawLabel = ""): MediaAttachmentType {
  const label = rawLabel.trim().toLowerCase();
  const path = pathFromUrl(url);

  if (label.startsWith("video")) return "video";
  if (label.startsWith("audio") || label.startsWith("voice")) return "audio";
  if (label.startsWith("document") || label.startsWith("pdf") || label.startsWith("notes")) {
    return "document";
  }
  if (label.startsWith("image") || label.startsWith("photo") || label.startsWith("picture")) {
    return "image";
  }

  if (path.includes("/api/files/r2/videos/") || VIDEO_EXTENSIONS.test(path)) return "video";
  if (path.includes("/api/files/r2/audio/") || AUDIO_EXTENSIONS.test(path)) return "audio";
  if (path.includes("/api/files/r2/documents/") || DOCUMENT_EXTENSIONS.test(path)) return "document";
  if (path.includes("/api/files/r2/images/") || IMAGE_EXTENSIONS.test(path)) return "image";

  return "file";
}

export function extractMediaAttachments(content: string): ParsedMediaContent {
  if (!content) return { attachments: [], text: "" };

  const attachments: MediaAttachment[] = [];
  const seen = new Set<string>();

  const text = content.replace(MEDIA_MARKER_REGEX, (_match, rawLabel: string, url: string) => {
    const parts = String(rawLabel || "").split(":");
    const label = parts[1] || undefined;
    const size = parts[2] ? Number.parseInt(parts[2], 10) : undefined;
    const normalizedUrl = String(url).trim();
    const key = normalizedUrl.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      attachments.push({
        type: classifyMediaAttachment(normalizedUrl, rawLabel),
        url: normalizedUrl,
        label,
        size: Number.isFinite(size) ? size : undefined,
      });
    }

    return "";
  });

  return {
    attachments,
    text: text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
  };
}

export function stripMediaAttachmentMarkers(content: string): string {
  return extractMediaAttachments(content).text;
}

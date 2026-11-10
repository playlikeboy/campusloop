import { extractYouTubeId } from "@/lib/embeds";

export interface YoutubeEmbedInfo {
  videoId: string | null;
  playlistId: string | null;
  isPlaylist: boolean;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

/**
 * Resolve a YouTube video/playlist URL into embed-ready pieces.
 * Shared between the resource viewer (AcademicPdfViewer) and the Udemy-style watch page
 * so both read the same ID/playlist extraction logic.
 */
export function getYoutubeEmbedInfo(rawUrl: string): YoutubeEmbedInfo {
  const url = (rawUrl || "").trim();
  const videoId = extractYouTubeId(url);
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  const playlistId = playlistMatch ? playlistMatch[1] : null;

  let embedUrl: string | null = null;
  if (videoId && playlistId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?list=${playlistId}&rel=0&modestbranding=1`;
  } else if (playlistId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`;
  } else if (videoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  }

  return {
    videoId,
    playlistId,
    isPlaylist: Boolean(playlistId),
    embedUrl,
    thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
  };
}

export function isYoutubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url || "");
}

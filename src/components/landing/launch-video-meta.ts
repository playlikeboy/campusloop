/**
 * The landing launch video. Files live in public/launch and are rendered
 * separately; the player copes with any of them being missing.
 */
export const LAUNCH_VIDEO = {
  title: "CampusLoop launch",
  heading: "See CampusLoop in 60 seconds",
  description:
    "A one-minute tour of CampusLoop: confessions, polls, events, notes and clubs from your own college, free for every student.",
  src: "/launch/campusloop-launch.mp4",
  verticalSrc: "/launch/campusloop-launch-vertical.mp4",
  poster: "/launch/poster.jpg",
  captions: "/launch/campusloop-launch.vtt",
  width: 1920,
  height: 1080,
  /** Date the video went up, for VideoObject.uploadDate. */
  uploadDate: "2026-11-19",
  /** Narrow portrait screens get the 9:16 cut. Keep in sync with the `max-sm:portrait:` classes. */
  verticalQuery: "(max-width: 639.98px) and (orientation: portrait)",
} as const;

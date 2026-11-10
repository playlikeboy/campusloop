/**
 * Legacy alias. New code imports from "@/constants/social".
 */
import { SOCIAL_LINKS as CANONICAL } from "@/constants/social";

export const SOCIAL_LINKS = {
  instagram: { name: CANONICAL.instagram.label, handle: CANONICAL.instagram.handle, url: CANONICAL.instagram.url },
  linkedin: { name: CANONICAL.linkedin.label, handle: CANONICAL.linkedin.handle, url: CANONICAL.linkedin.url },
  x: { name: "X (Twitter)", handle: CANONICAL.x.handle, url: CANONICAL.x.url },
} as const;

export const SOCIAL_MEDIA_ITEMS = [
  {
    id: "instagram",
    name: SOCIAL_LINKS.instagram.name,
    handle: SOCIAL_LINKS.instagram.handle,
    url: SOCIAL_LINKS.instagram.url,
    label: "Follow on Instagram",
  },
  {
    id: "linkedin",
    name: SOCIAL_LINKS.linkedin.name,
    handle: SOCIAL_LINKS.linkedin.handle,
    url: SOCIAL_LINKS.linkedin.url,
    label: "Connect on LinkedIn",
  },
  {
    id: "x",
    name: "X",
    handle: SOCIAL_LINKS.x.handle,
    url: SOCIAL_LINKS.x.url,
    label: "Follow on X",
  },
] as const;

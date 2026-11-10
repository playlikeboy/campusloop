import type { CustomLink } from "@/lib/social-links";
import { isCollegeVerifiedUser } from "@/lib/user-verification";

/**
 * The only profile fields that are sent to the browser. Email, date of birth,
 * dating preferences and other private columns stay on the server.
 */
export interface ProfileView {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  points?: number | null;
  role?: string | null;
  photos?: string[] | null;
  interests?: string[] | null;
  socialLinks?: { platforms?: Record<string, string>; custom?: CustomLink[] } | null;
  createdAt?: Date | string | null;
  isVerified: boolean;
  institution?: { id: string; name: string; slug: string } | null;
}

type ProfileRow = Omit<ProfileView, "isVerified" | "institution" | "socialLinks"> & {
  email?: string | null;
  isCollegeVerified?: boolean | null;
  institutionId?: string | null;
  socialLinks?: unknown;
  institution?: { id: string; name: string; slug: string } | null;
};

export function toProfileView(row: ProfileRow): ProfileView {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bannerUrl: row.bannerUrl,
    headline: row.headline,
    bio: row.bio,
    course: row.course,
    branch: row.branch,
    year: row.year,
    points: row.points,
    role: row.role,
    photos: row.photos,
    interests: row.interests,
    socialLinks: (row.socialLinks as ProfileView["socialLinks"]) ?? null,
    createdAt: row.createdAt,
    isVerified: isCollegeVerifiedUser(row),
    institution: row.institution
      ? { id: row.institution.id, name: row.institution.name, slug: row.institution.slug }
      : null,
  };
}

/** Official accounts run by the CampusLoop team. */
export function isOfficialProfile(profile: { username: string; role?: string | null }) {
  return profile.username.startsWith("loop_") || profile.role === "ADMIN";
}

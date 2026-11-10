import { GraduationCap } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MentionTag, VerifiedSticker } from "@/components/ui/stickers";
import type { CustomLink } from "@/lib/social-links";
import { cn, initialOf } from "@/lib/utils";

export interface ProfileStat {
  label: string;
  value: number | string;
  href?: string;
  onClick?: () => void;
}

export interface ProfileIdentityProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  institution?: { name: string; slug?: string | null } | null;
  course?: string | null;
  branch?: string | null;
  year?: number | null;
  bio?: string | null;
  socialLinks?: { platforms?: Record<string, string>; custom?: CustomLink[] } | null;
  interests?: string[] | null;
  isVerified?: boolean;
  isOfficial?: boolean;
  isOwnProfile?: boolean;
  stats: ProfileStat[];
  /** Buttons next to the avatar (follow, message, edit). */
  actions?: React.ReactNode;
  /** Small icon buttons on the cover (back, share, cover edit). */
  coverActions?: React.ReactNode;
  /** Replaces the avatar, e.g. a button that opens photo options. */
  avatarSlot?: React.ReactNode;
  /** Extra line under the bio, e.g. Loop Points for the owner. */
  extra?: React.ReactNode;
}

export function ProfileAvatar({
  displayName,
  avatarUrl,
  className,
}: {
  displayName: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-24 border-4 border-bg bg-surface shadow-sm sm:size-32", className)}>
      <AvatarImage src={avatarUrl || ""} alt={`${displayName}'s photo`} className="object-cover" />
      <AvatarFallback className="bg-surface-muted font-display text-3xl font-bold text-fg">
        {initialOf(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}

function courseLine(course?: string | null, branch?: string | null, year?: number | null) {
  const parts = [[course, branch].filter(Boolean).join(" "), year ? `Year ${year}` : null].filter(Boolean);
  return parts.join(" · ");
}

/**
 * Shared profile header for /profile, /@username (signed in) and the public
 * /@username page: cover, avatar, name, college, verified sticker, bio and counts.
 */
export function ProfileIdentity({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  institution,
  course,
  branch,
  year,
  bio,
  socialLinks,
  interests,
  isVerified,
  isOfficial,
  isOwnProfile,
  stats,
  actions,
  coverActions,
  avatarSlot,
  extra,
}: ProfileIdentityProps) {
  const study = courseLine(course, branch, year);

  return (
    <section aria-label={`${displayName}'s profile`}>
      <div
        className={cn(
          "relative h-36 w-full overflow-hidden sm:h-52 sm:rounded-b-xl lg:h-60",
          bannerUrl ? "bg-surface-muted" : "story-field"
        )}
      >
        {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
        {coverActions && (
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            {coverActions}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6">
        <div className="relative z-10 -mt-12 mb-3 flex flex-wrap items-end justify-between gap-3 sm:-mt-16">
          {avatarSlot ?? <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} />}
          {actions && <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div>}
        </div>

        <div className="space-y-3">
          <div className="min-w-0">
            <h1 className="text-2xl break-words text-fg sm:text-3xl">{displayName}</h1>
            <p className="text-sm text-fg-muted">@{username}</p>
          </div>

          {(isVerified || isOfficial || institution) && (
            <div className="flex flex-wrap items-center gap-2">
              {isVerified && <VerifiedSticker size="sm" className="sticker-pop" />}
              {isOfficial && <Badge variant="brand">CampusLoop team</Badge>}
              {institution?.slug ? (
                <MentionTag
                  username={institution.slug}
                  href={`/colleges/${institution.slug}`}
                  size="sm"
                  title={institution.name}
                  className="relative after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']"
                />
              ) : null}
            </div>
          )}

          {(study || institution?.name) && (
            <p className="flex items-start gap-2 text-sm text-fg-muted">
              <GraduationCap aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{[study, institution?.name].filter(Boolean).join(" at ")}</span>
            </p>
          )}

          {bio ? (
            <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap text-fg sm:text-base">
              {bio}
            </p>
          ) : isOwnProfile ? (
            <Link href="/profile/edit" className="text-sm font-medium text-brand-text hover:underline">
              Add a short bio
            </Link>
          ) : null}

          <ProfileSocialLinks links={socialLinks} isOwnProfile={isOwnProfile} />

          {extra}

          <ul className="flex flex-wrap items-center gap-x-5 border-y border-border py-1">
            {stats.map((stat) => {
              const body = (
                <>
                  <span className="font-semibold tabular-nums text-fg">{stat.value}</span>{" "}
                  <span className="text-fg-muted">{stat.label}</span>
                </>
              );
              const interactive =
                "inline-flex min-h-11 items-center rounded-sm text-sm transition-ui hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring outline-none";
              return (
                <li key={stat.label}>
                  {stat.href ? (
                    <Link href={stat.href} className={interactive}>
                      {body}
                    </Link>
                  ) : stat.onClick ? (
                    <button
                      type="button"
                      onClick={stat.onClick}
                      className={cn(interactive, "cursor-pointer")}
                    >
                      {body}
                    </button>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-sm">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>

          {interests && interests.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
              {interests.map((interest) => (
                <li key={interest}>
                  <Badge variant="neutral">#{interest.replace(/^#/, "")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

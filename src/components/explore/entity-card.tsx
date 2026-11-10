"use client";

import {
  Building2,
  Calendar,
  Download,
  GraduationCap,
  MapPin,
  ShoppingBag,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

// ─── 1. Community Preview Card ───
export function CommunityPreviewCard({
  community,
}: {
  community: {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    avatarUrl?: string | null;
    category?: string | null;
    privacy?: string;
  };
}) {
  return (
    <Link
      href={`/communities/${community.slug || community.id}`}
      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui"
    >
      <Avatar className="size-10 rounded-xl shrink-0 border border-border">
        {community.avatarUrl && <AvatarImage src={community.avatarUrl} alt={community.name} />}
        <AvatarFallback className="rounded-xl text-xs font-semibold bg-primary/10 text-primary">
          {community.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui truncate">
            {community.name}
          </h3>
          {community.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0 font-normal">
              {community.category}
            </Badge>
          )}
        </div>
        {community.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
            {community.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── 2. Event Preview Card ───
export function EventPreviewCard({
  event,
}: {
  event: {
    id: string;
    slug: string;
    title: string;
    tagline?: string | null;
    clubName: string;
    mode: string;
    venue?: string | null;
    startDate: string | Date;
    bannerUrl?: string | null;
  };
}) {
  const formattedDate = new Date(event.startDate).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/events/${event.slug || event.id}`}
      className="group flex flex-col justify-between p-3.5 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui space-y-2.5"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary truncate">{event.clubName}</span>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="size-3 text-muted-foreground" />
            <span>{formattedDate}</span>
          </span>
        </div>
        <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui line-clamp-1">
          {event.title}
        </h3>
        {event.tagline && <p className="text-xs text-muted-foreground line-clamp-1">{event.tagline}</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
        <span className="truncate">{event.venue || event.mode}</span>
        <span className="text-primary font-semibold text-xs">View event</span>
      </div>
    </Link>
  );
}

// ─── 3. Academic Resource Preview Card ───
export function AcademicPreviewCard({
  resource,
}: {
  resource: {
    id: string;
    title: string;
    subjectCode: string;
    subjectName: string;
    branch?: string;
    semester?: number;
    resourceType: string;
    downloadsCount?: number;
  };
}) {
  return (
    <Link
      href={`/academics/study-material/${resource.id}`}
      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui"
    >
      <div className="size-10 rounded-xl bg-brand/10 text-brand-text flex items-center justify-center shrink-0 border border-brand-subtle-border/20">
        <GraduationCap className="size-5" />
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-semibold text-brand-text tracking-wider">
            {resource.subjectCode} · {resource.resourceType}
          </span>
          {resource.downloadsCount !== undefined && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Download className="size-3" />
              {resource.downloadsCount}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui line-clamp-1">
          {resource.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{resource.subjectName}</p>
      </div>
    </Link>
  );
}

// ─── 4. Article Preview Card ───
export function ArticlePreviewCard({
  article,
}: {
  article: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    readingTimeMinutes?: number;
    category?: string;
    author?: { displayName?: string | null; username?: string | null; avatarUrl?: string | null } | null;
  };
}) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col justify-between p-3.5 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui space-y-2"
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{article.author?.displayName || "Student Author"}</span>
          <span className="shrink-0">{article.readingTimeMinutes || 3} min read</span>
        </div>
        <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui line-clamp-2 leading-snug">
          {article.title}
        </h3>
        {article.excerpt && <p className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</p>}
      </div>

      <span className="text-xs font-medium text-primary inline-block pt-1">Read article</span>
    </Link>
  );
}

// ─── 5. College Preview Card ───
export function CollegePreviewCard({
  college,
}: {
  college: {
    id: string;
    slug?: string | null;
    name: string;
    state?: string | null;
    district?: string | null;
    logoUrl?: string | null;
    nirfRank?: number | null;
  };
}) {
  const location = [college.district, college.state].filter(Boolean).join(", ");

  return (
    <Link
      href={college.slug ? `/colleges/${college.slug}` : `/colleges/${college.id}`}
      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui"
    >
      <Avatar className="size-10 rounded-xl shrink-0 border border-border">
        {college.logoUrl && <AvatarImage src={college.logoUrl} alt={college.name} />}
        <AvatarFallback className="rounded-xl text-xs font-semibold bg-primary/10 text-primary">
          <Building2 className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui truncate">
            {college.name}
          </h3>
          {college.nirfRank && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 shrink-0 font-normal">
              NIRF #{college.nirfRank}
            </Badge>
          )}
        </div>
        {location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── 6. Person Preview Card with Real Follow ───
export function PersonPreviewCard({
  person,
}: {
  person: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    headline?: string | null;
    branch?: string | null;
    points?: number;
    institution?: { name?: string | null } | null;
  };
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleFollowToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    sounds.tap();
    haptics.light();
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setIsPending(true);

    try {
      if (nextState) {
        const res = await fetch(`/api/profile/${person.username}/follow`, { method: "POST" });
        if (!res.ok) throw new Error("follow failed");
        toast.success(`Following @${person.username}`);
      } else {
        const res = await fetch(`/api/profile/${person.username}/follow`, { method: "DELETE" });
        if (!res.ok) throw new Error("unfollow failed");
        toast.info(`Unfollowed @${person.username}`);
      }
    } catch {
      setIsFollowing(!nextState);
      toast.error("Couldn't update. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Link
      href={`/${person.username}`}
      className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="size-10 rounded-full shrink-0 border border-border">
          {person.avatarUrl && <AvatarImage src={person.avatarUrl} alt={person.displayName} />}
          <AvatarFallback className="text-xs font-semibold">
            {person.displayName?.slice(0, 1) || "S"}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui truncate">
            {person.displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            @{person.username}
            {person.institution?.name ? ` · ${person.institution.name.split(",")[0]}` : ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFollowToggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isFollowing
            ? "border border-border bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        )}
      >
        {isFollowing ? (
          <>
            <UserCheck className="size-3" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="size-3" />
            <span>Follow</span>
          </>
        )}
      </button>
    </Link>
  );
}

// ─── 7. Store Preview Card ───
export function StorePreviewCard({
  store,
}: {
  store: {
    id: string;
    name: string;
    category?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    address?: string | null;
  };
}) {
  return (
    <Link
      href="/marketplace"
      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-ui"
    >
      <Avatar className="size-10 rounded-xl shrink-0 border border-border">
        {store.logoUrl && <AvatarImage src={store.logoUrl} alt={store.name} />}
        <AvatarFallback className="rounded-xl text-xs font-semibold bg-warning/10 text-warning">
          <ShoppingBag className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <h3 className="text-sm font-semibold text-fg group-hover:text-brand-text transition-ui truncate">
            {store.name}
          </h3>
          {store.category && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0 font-normal">
              {store.category}
            </Badge>
          )}
        </div>
        {store.address && <p className="text-xs text-muted-foreground truncate">{store.address}</p>}
      </div>
    </Link>
  );
}

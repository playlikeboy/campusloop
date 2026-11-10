"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifiedSticker } from "@/components/ui/stickers";
import { getAvatarUrl, initialOf } from "@/lib/utils";
import type { CommunityDetailProps } from "./community-detail-client";
import { CommunityRoleBadge } from "./community-role-badge";
import { EmptySticker } from "./empty-sticker";

type Members = NonNullable<CommunityDetailProps["membersList"]>;
type Related = NonNullable<CommunityDetailProps["relatedCommunities"]>;

export function CommunityMembersPanel({ members }: { members: Members }) {
  if (members.length === 0) {
    return (
      <EmptyState
        illustration={<EmptySticker icon={Users} />}
        size="compact"
        bordered
        title="No members to show yet"
      />
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {members.map((m) => (
        <li key={m.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
          <Link href={`/@${m.user.username}`} className="group flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={m.user.avatarUrl || ""} alt="" />
              <AvatarFallback>{initialOf(m.user.displayName, "U")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-semibold text-fg group-hover:underline">{m.user.displayName}</span>
                {m.user.isCollegeVerified && (
                  <VerifiedSticker label="Verified" size="sm" className="h-6 shrink-0 shadow-none" />
                )}
              </p>
              <p className="truncate text-sm text-fg-muted">
                @{m.user.username}
                {m.user.headline ? ` · ${m.user.headline}` : ""}
              </p>
            </div>
          </Link>
          <CommunityRoleBadge role={m.role} showMember={false} />
        </li>
      ))}
    </ul>
  );
}

const DEFAULT_RULES = [
  { title: "Be kind", description: "No bullying, hate or personal attacks." },
  { title: "Stay on topic", description: "Keep posts related to this community." },
  { title: "No spam", description: "No ads, referral links or repeated posts." },
];

export function CommunityRulesPanel({ rules }: { rules: Array<{ title: string; description: string }> }) {
  const list = rules.length > 0 ? rules : DEFAULT_RULES;
  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold text-fg">Rules</h2>
      <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-fg-muted">
        {list.map((rule, idx) => (
          <li key={`${rule.title}-${idx}`}>
            <p className="font-semibold text-fg">{rule.title}</p>
            {rule.description && <p className="text-sm text-fg-muted">{rule.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CommunitySidebar({
  community,
  relatedCommunities,
}: {
  community: CommunityDetailProps["community"];
  relatedCommunities: Related;
}) {
  const started = new Date(community.createdAt).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-base font-bold text-fg">About</h2>
        <dl className="mt-2 divide-y divide-border text-sm">
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-fg-muted">Started</dt>
            <dd className="font-semibold text-fg">{started}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-fg-muted">Who can see posts</dt>
            <dd className="font-semibold text-fg">
              {community.privacy === "PRIVATE" ? "Members only" : "Everyone"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-fg-muted">Anonymous posts</dt>
            <dd className="font-semibold text-fg">
              {community.allowAnonymousPosts === false ? "Off" : "Allowed"}
            </dd>
          </div>
        </dl>
      </section>

      {relatedCommunities.length > 0 && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-fg">More communities</h2>
            <Link href="/communities" className="text-sm font-semibold text-brand-text hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-2 space-y-1">
            {relatedCommunities.slice(0, 3).map((rel) => (
              <li key={rel.id}>
                <Link
                  href={`/communities/${rel.slug || rel.id}`}
                  className="group -mx-2 flex min-h-11 items-center gap-3 rounded-sm px-2 py-1.5 transition-ui hover:bg-surface-muted"
                >
                  <Avatar className="size-9 shrink-0 rounded-sm">
                    <AvatarImage src={getAvatarUrl(rel.avatarUrl, rel.name)} alt="" />
                    <AvatarFallback className="rounded-sm text-xs">
                      {rel.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg group-hover:text-brand-text">
                      c/{rel.name}
                    </p>
                    <p className="text-xs text-fg-muted tabular-nums">
                      {rel.membersCount} {rel.membersCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

/* biome-ignore-all lint/suspicious/noExplicitAny: the gaming APIs return untyped payloads */
"use client";

import { Gamepad2, Medal, MessageSquare, Plus, Shield, Sword, Video } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GamingLobbyCard } from "@/components/communities/gaming-lobby-card";
import { TeammateCard } from "@/components/gaming/teammate-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatTimeAgo, getAvatarUrl, initialOf } from "@/lib/utils";

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      bordered
      size="compact"
      icon={Gamepad2}
      title="This didn't load"
      description="Check your connection and try again."
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

/** A row of chips that scrolls sideways on phones. */
export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

export function LobbiesPanel({
  data,
  error,
  isLoading,
  highlighted,
  profileId,
  search,
  onClearSearch,
  onRefresh,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
  highlighted: any | null;
  profileId: string;
  search: string;
  onClearSearch: () => void;
  onRefresh: () => void;
}) {
  const items: any[] = data?.items ?? [];
  return (
    <div className="space-y-3">
      {highlighted && (
        <section aria-label="Shared with you" className="space-y-2">
          <p className="text-sm font-semibold text-fg">Shared with you</p>
          <GamingLobbyCard item={highlighted} currentUserId={profileId} onRefresh={onRefresh} />
        </section>
      )}
      {error && !items.length ? (
        <PanelError onRetry={onRefresh} />
      ) : isLoading ? (
        <PanelSkeleton label="Loading lobbies" />
      ) : items.length > 0 ? (
        <>
          {items.map((lobby) => (
            <GamingLobbyCard key={lobby.id} item={lobby} currentUserId={profileId} onRefresh={onRefresh} />
          ))}
          {data.totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination page={data.page} totalPages={data.totalPages} />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={Gamepad2}
          title={search ? "No lobbies match" : "No open lobbies right now"}
          description={search ? "Try a different word or game." : "Start one and others can jump in."}
          action={
            search ? (
              <Button variant="secondary" onClick={onClearSearch}>
                Clear search
              </Button>
            ) : (
              <Button asChild>
                <Link href="/gaming/new">
                  <Plus aria-hidden /> Start a lobby
                </Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );
}

export function TeammatesPanel({
  data,
  error,
  isLoading,
  onEditCard,
  onRetry,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
  onEditCard: () => void;
  onRetry: () => void;
}) {
  const teammates: any[] = data?.teammates ?? [];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-fg-muted">
          Want to show up here? Add your game tags and turn on "Looking for a team".
        </p>
        <Button variant="outline" size="sm" onClick={onEditCard}>
          <Shield aria-hidden /> Edit gamer card
        </Button>
      </div>
      {error && !teammates.length ? (
        <PanelError onRetry={onRetry} />
      ) : isLoading ? (
        <PanelSkeleton label="Loading players" />
      ) : teammates.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {teammates.map((teammate) => (
            <TeammateCard key={teammate.id} teammate={teammate} />
          ))}
        </div>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={Sword}
          title="No one is looking for a team yet"
          description="Turn it on in your gamer card and you'll be the first."
        />
      )}
    </div>
  );
}

export function FeedPanel({
  data,
  error,
  isLoading,
  onRetry,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
  onRetry: () => void;
}) {
  const posts: any[] = data?.posts ?? [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Clips, match recaps and "need one more" posts.</p>
        <Button asChild size="sm">
          <Link href="/post/new?tag=gaming">
            <Plus aria-hidden /> Post
          </Link>
        </Button>
      </div>
      {error && !posts.length ? (
        <PanelError onRetry={onRetry} />
      ) : isLoading ? (
        <PanelSkeleton label="Loading posts" />
      ) : posts.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {posts.map((post) => (
            <li key={post.id} className="space-y-2 p-4">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9">
                  <AvatarImage src={getAvatarUrl(post.author?.avatarUrl, post.author?.username)} alt="" />
                  <AvatarFallback className="text-xs">{initialOf(post.author?.displayName, "U")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/@${post.author?.username}`}
                    className="text-sm font-semibold text-fg hover:underline"
                  >
                    {post.author?.displayName}
                  </Link>
                  <p className="text-xs text-fg-subtle">
                    @{post.author?.username} · {formatTimeAgo(post.createdAt)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-line text-base text-fg">{post.content}</p>
              <Link
                href={`/post/${post.id}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
              >
                <MessageSquare className="size-4" aria-hidden />
                {post.commentsCount || 0} replies
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={Video}
          title="No gaming posts yet"
          description="Share a clip or ask for a teammate."
          action={
            <Button asChild>
              <Link href="/post/new?tag=gaming">Post a clip</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

export function LeaderboardPanel({
  data,
  error,
  isLoading,
  gameLabel,
  onFindTournament,
  onRetry,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
  gameLabel: string;
  onFindTournament: () => void;
  onRetry: () => void;
}) {
  const players: any[] = data?.leaderboard ?? [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">
        {gameLabel} rankings this season. Win tournaments here to climb.
      </p>
      {error && !players.length ? (
        <PanelError onRetry={onRetry} />
      ) : isLoading ? (
        <PanelSkeleton label="Loading rankings" />
      ) : players.length > 0 ? (
        <ol className="divide-y divide-border rounded-lg border border-border bg-surface">
          {players.map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                    player.rank <= 3 ? "bg-fg text-bg" : "bg-surface-muted text-fg-muted"
                  )}
                >
                  {player.rank}
                </span>
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={getAvatarUrl(player.user?.avatarUrl, player.user?.username)} alt="" />
                  <AvatarFallback className="text-xs">{initialOf(player.user?.displayName, "U")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-fg">{player.user?.displayName}</p>
                  <p className="truncate text-xs text-fg-muted">
                    @{player.user?.username}
                    {player.institution?.name ? ` · ${player.institution.name.split(",")[0]}` : ""}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-fg">{player.rankingPoints} pts</p>
                <p className="text-xs tabular-nums text-fg-muted">
                  {player.tournamentsWon} wins · {player.winRate}%
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          bordered
          size="compact"
          icon={Medal}
          title="No rankings yet"
          description="Play a tournament here to get on the board."
          action={<Button onClick={onFindTournament}>See tournaments</Button>}
        />
      )}
    </div>
  );
}

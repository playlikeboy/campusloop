/* biome-ignore-all lint/suspicious/noExplicitAny: the gaming APIs return untyped payloads */
"use client";

import { ArrowLeft, ChevronRight, Plus, Trophy } from "lucide-react";
import { TournamentBracketViewer } from "@/components/gaming/tournament-bracket-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PanelError, PanelSkeleton } from "./gaming-panels";

const STATUS_LABEL: Record<string, string> = {
  REGISTRATION_OPEN: "Open",
  IN_PROGRESS: "Playing now",
  COMPLETED: "Finished",
  CANCELLED: "Cancelled",
};

function statusBadge(status: string) {
  const label = STATUS_LABEL[status] ?? status.replace(/_/g, " ").toLowerCase();
  const variant =
    status === "REGISTRATION_OPEN" ? "verified" : status === "IN_PROGRESS" ? "warning" : "neutral";
  return <Badge variant={variant}>{label}</Badge>;
}

function TournamentDetail({
  tournament,
  detail,
  profileId,
  registering,
  generating,
  onBack,
  onRegister,
  onGenerate,
  onRefresh,
}: {
  tournament: any;
  detail: any;
  profileId: string;
  registering: boolean;
  generating: boolean;
  onBack: () => void;
  onRegister: () => void;
  onGenerate: () => void;
  onRefresh: () => void;
}) {
  const t = detail?.tournament;
  const status = t?.status || tournament.status;
  const filled = t?.entries?.length ?? tournament.currentParticipants;
  const starts = new Date(tournament.startsAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack} className="-ml-3">
        <ArrowLeft aria-hidden /> All tournaments
      </Button>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neutral">{tournament.gameName}</Badge>
          {statusBadge(status)}
        </div>
        <h2 className="font-display text-2xl font-bold text-fg">{t?.title || tournament.title}</h2>
        <p className="text-sm text-fg-muted">
          {String(tournament.format || "")
            .replace(/_/g, " ")
            .toLowerCase()}{" "}
          · up to {tournament.maxParticipants} teams
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-fg-muted">Starts</dt>
          <dd className="font-medium tabular-nums text-fg">{starts}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Teams in</dt>
          <dd className="font-medium tabular-nums text-fg">
            {filled} of {tournament.maxParticipants}
          </dd>
        </div>
        {tournament.prizePool && (
          <div>
            <dt className="text-fg-muted">Prize</dt>
            <dd className="font-medium text-fg">{tournament.prizePool}</dd>
          </div>
        )}
      </dl>

      {(status === "REGISTRATION_OPEN" && !t?.userEntry) ||
      (t?.isOrganizer && status === "REGISTRATION_OPEN") ? (
        <div className="flex flex-wrap gap-2">
          {status === "REGISTRATION_OPEN" && !t?.userEntry && (
            <Button onClick={onRegister} loading={registering}>
              <Plus aria-hidden /> Join tournament
            </Button>
          )}
          {t?.isOrganizer && status === "REGISTRATION_OPEN" && (
            <Button variant="outline" onClick={onGenerate} loading={generating}>
              <Trophy aria-hidden /> Close sign-ups and make bracket
            </Button>
          )}
        </div>
      ) : t?.userEntry ? (
        <Badge variant="verified">You're in</Badge>
      ) : null}

      {tournament.rules && (
        <section className="space-y-1.5">
          <h3 className="font-display text-lg font-bold text-fg">Rules</h3>
          <p className="max-w-[68ch] whitespace-pre-line text-base text-fg">{tournament.rules}</p>
        </section>
      )}

      <TournamentBracketViewer
        tournamentSlug={tournament.slug}
        matches={t?.matches || []}
        isOrganizer={Boolean(t?.isOrganizer)}
        currentUserId={profileId}
        onRefresh={onRefresh}
      />
    </div>
  );
}

export function TournamentsPanel({
  data,
  error,
  isLoading,
  selected,
  detail,
  profileId,
  registering,
  generating,
  onSelect,
  onRegister,
  onGenerate,
  onRefreshDetail,
  onHost,
  onRetry,
}: {
  data: any;
  error: unknown;
  isLoading: boolean;
  selected: any | null;
  detail: any;
  profileId: string;
  registering: boolean;
  generating: boolean;
  onSelect: (t: any | null) => void;
  onRegister: (slug: string) => void;
  onGenerate: (slug: string) => void;
  onRefreshDetail: () => void;
  onHost: () => void;
  onRetry: () => void;
}) {
  if (selected) {
    return (
      <TournamentDetail
        tournament={selected}
        detail={detail}
        profileId={profileId}
        registering={registering}
        generating={generating}
        onBack={() => onSelect(null)}
        onRegister={() => onRegister(selected.slug)}
        onGenerate={() => onGenerate(selected.slug)}
        onRefresh={onRefreshDetail}
      />
    );
  }

  const tournaments: any[] = data?.tournaments ?? [];
  if (error && !tournaments.length) return <PanelError onRetry={onRetry} />;
  if (isLoading) return <PanelSkeleton label="Loading tournaments" />;
  if (!tournaments.length) {
    return (
      <EmptyState
        bordered
        size="compact"
        icon={Trophy}
        title="No tournaments right now"
        description="Run one for your college and others can sign up."
        action={<Button onClick={onHost}>Host a tournament</Button>}
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {tournaments.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onSelect(t)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0 space-y-1.5">
              <span className="flex flex-wrap items-center gap-1.5">
                <Badge variant="neutral">{t.gameName}</Badge>
                {statusBadge(t.status)}
              </span>
              <span className="block truncate font-semibold text-fg">{t.title}</span>
              <span className="block text-sm tabular-nums text-fg-muted">
                {t.currentParticipants} of {t.maxParticipants} teams
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

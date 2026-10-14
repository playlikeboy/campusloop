"use client";

import {
  ArrowLeft,
  ChevronRight,
  Crosshair,
  Filter,
  Flame,
  Gamepad2,
  Globe,
  Headphones,
  Laptop,
  Layers,
  Loader2,
  Medal,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sword,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { GamingLobbyCard } from "@/components/communities/gaming-lobby-card";
import { GamerProfileDialog } from "@/components/gaming/gamer-profile-dialog";
import { HostTournamentDialog } from "@/components/gaming/host-tournament-dialog";
import { TeammateCard } from "@/components/gaming/teammate-card";
import { TournamentBracketViewer } from "@/components/gaming/tournament-bracket-viewer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface GamingClientProps {
  profileId: string;
}

type GamingTab = "lobbies" | "tournaments" | "teammates" | "feed" | "leaderboard";

const GAMES_LIST = [
  { label: "All Games", value: "all" },
  { label: "Valorant", value: "Valorant" },
  { label: "BGMI / PUBG", value: "BGMI" },
  { label: "Chess", value: "Chess" },
  { label: "EA FC / FIFA", value: "EA FC" },
  { label: "CS2", value: "CS2" },
  { label: "Rocket League", value: "Rocket League" },
];

const LOBBY_MODES = [
  { label: "All Formats", value: "all" },
  { label: "5v5 Squad", value: "5V5" },
  { label: "1v1 Duel", value: "1V1" },
  { label: "Competitive Scrim", value: "SCRIM" },
  { label: "Ranked Rush", value: "RANKED" },
  { label: "Casual Fun", value: "CASUAL" },
];

export function GamingClient({ profileId }: GamingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = (searchParams.get("tab") as GamingTab) || "lobbies";
  const [activeTab, setActiveTab] = useState<GamingTab>(tabParam);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [scope, setScope] = useState<"all" | "campus">("campus");

  // Dialog controls
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostTournamentOpen, setIsHostTournamentOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

  // Sync tab with URL
  const handleTabChange = useCallback(
    (tab: GamingTab) => {
      setActiveTab(tab);
      sounds.tap();
      haptics.light();
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // --- SWR 1: Lobbies ---
  const lobbiesUrl = useMemo(() => {
    const p = new URLSearchParams({
      game: selectedGame,
      mode: selectedMode,
      scope,
      limit: "16",
    });
    if (search.trim()) p.set("q", search.trim());
    return `/api/gaming/lobbies?${p.toString()}`;
  }, [selectedGame, selectedMode, scope, search]);

  const {
    data: lobbiesData,
    isLoading: isLobbiesLoading,
    mutate: mutateLobbies,
  } = useSWR<any>(activeTab === "lobbies" ? lobbiesUrl : null, fetcher, {
    revalidateOnFocus: true,
  });

  // --- SWR 2: Tournaments ---
  const tournamentsUrl = useMemo(() => {
    const p = new URLSearchParams({
      game: selectedGame,
      scope,
      limit: "12",
    });
    if (search.trim()) p.set("q", search.trim());
    return `/api/gaming/tournaments?${p.toString()}`;
  }, [selectedGame, scope, search]);

  const {
    data: tournamentsData,
    isLoading: isTournamentsLoading,
    mutate: mutateTournaments,
  } = useSWR<any>(activeTab === "tournaments" ? tournamentsUrl : null, fetcher, {
    revalidateOnFocus: true,
  });

  // --- SWR 2b: Selected Tournament Detail ---
  const tournamentDetailUrl = selectedTournament
    ? `/api/gaming/tournaments/${selectedTournament.slug}`
    : null;

  const {
    data: tournamentDetailData,
    isLoading: isDetailLoading,
    mutate: mutateTournamentDetail,
  } = useSWR<any>(tournamentDetailUrl, fetcher, {
    revalidateOnFocus: true,
  });

  // --- SWR 3: Teammates (LFT) ---
  const teammatesUrl = useMemo(() => {
    const p = new URLSearchParams({
      game: selectedGame,
      scope,
      limit: "24",
    });
    if (search.trim()) p.set("q", search.trim());
    return `/api/gaming/teammates?${p.toString()}`;
  }, [selectedGame, scope, search]);

  const {
    data: teammatesData,
    isLoading: isTeammatesLoading,
    mutate: mutateTeammates,
  } = useSWR<any>(activeTab === "teammates" ? teammatesUrl : null, fetcher, {
    revalidateOnFocus: true,
  });

  // --- SWR 4: Gaming Feed & Clips ---
  const feedUrl = useMemo(() => {
    return `/api/feed?tab=gaming&limit=15`;
  }, []);

  const {
    data: feedData,
    isLoading: isFeedLoading,
    mutate: mutateFeed,
  } = useSWR<any>(activeTab === "feed" ? feedUrl : null, fetcher, {
    revalidateOnFocus: true,
  });

  // --- SWR 5: Leaderboard ---
  const leaderboardUrl = useMemo(() => {
    const p = new URLSearchParams({
      game: selectedGame === "all" ? "Valorant" : selectedGame,
      scope,
      season: "2026-S1",
    });
    return `/api/gaming/progression?${p.toString()}`;
  }, [selectedGame, scope]);

  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    mutate: mutateLeaderboard,
  } = useSWR<any>(activeTab === "leaderboard" ? leaderboardUrl : null, fetcher, {
    revalidateOnFocus: true,
  });

  // Check query param ?id= to open specific lobby or highlight
  const urlLobbyId = searchParams.get("id");
  const highlightedLobby = useMemo(() => {
    if (!urlLobbyId || !lobbiesData?.items) return null;
    return lobbiesData.items.find((item: any) => item.id === urlLobbyId);
  }, [urlLobbyId, lobbiesData]);

  // Tournament Registration Handler
  const [registering, setRegistering] = useState(false);
  async function handleRegisterTournament(slug: string) {
    if (registering) return;
    setRegistering(true);
    sounds.tap();
    haptics.light();

    try {
      const res = await fetch(`/api/gaming/tournaments/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to register");

      mutateTournamentDetail();
      mutateTournaments();
    } catch (err: any) {
      alert(err.message || "Failed to register for tournament");
    } finally {
      setRegistering(false);
    }
  }

  // Generate Bracket Handler (Organizer Only)
  const [generatingBracket, setGeneratingBracket] = useState(false);
  async function handleGenerateBracket(slug: string) {
    if (generatingBracket) return;
    setGeneratingBracket(true);
    sounds.match();
    haptics.match();

    try {
      const res = await fetch(`/api/gaming/tournaments/${slug}/bracket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "Failed to generate bracket");

      mutateTournamentDetail();
      mutateTournaments();
    } catch (err: any) {
      alert(err.message || "Failed to generate bracket");
    } finally {
      setGeneratingBracket(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-background pb-28 text-foreground">
      {/* ─── Top Header & Campus Radius Switcher ─── */}
      <header className="sticky top-14 z-30 bg-background/85 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4 border-b border-border/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/communities"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Back to communities"
            >
              <ArrowLeft className="size-4.5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Gamepad2 className="size-4" />
                </span>
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">
                  Campus Gaming Arena
                </h1>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                Squad Finder · Tournaments · Teammates (LFT) · Progression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Campus Scope Switcher */}
            <button
              type="button"
              onClick={() => {
                setScope(scope === "campus" ? "all" : "campus");
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-bold text-foreground transition hover:bg-muted"
            >
              <Globe className="size-3 text-primary" />
              <span>{scope === "campus" ? "My Campus" : "All India"}</span>
            </button>

            {/* Edit Gamer Card */}
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(true);
                sounds.tap();
                haptics.light();
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20"
            >
              <Shield className="size-3" />
              <span className="hidden sm:inline">My Gamer Card</span>
              <span className="sm:hidden">Card</span>
            </button>

            {/* Action CTA */}
            {activeTab === "tournaments" ? (
              <button
                type="button"
                onClick={() => {
                  setIsHostTournamentOpen(true);
                  sounds.tap();
                  haptics.light();
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95"
              >
                <Trophy className="size-3.5" />
                <span>Host Cup</span>
              </button>
            ) : (
              <Link
                href="/gaming/new"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95"
              >
                <Plus className="size-3.5" />
                <span>Open Lobby</span>
              </Link>
            )}
          </div>
        </div>

        {/* ─── 5-Tab Navigation Bar ─── */}
        <div className="flex items-center gap-1 overflow-x-auto pt-3 scrollbar-none">
          {[
            { id: "lobbies", label: "Open Lobbies", icon: Users },
            { id: "tournaments", label: "Tournaments", icon: Trophy },
            { id: "teammates", label: "Find Teammates", icon: Sword },
            { id: "feed", label: "Clips & LFG", icon: Flame },
            { id: "leaderboard", label: "Leaderboard", icon: Medal },
          ].map(({ id, label, icon: Icon }) => {
            const isSelected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id as GamingTab)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Search & Game Filters Strip ─── */}
      <section className="px-3 pt-3 sm:px-5 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === "tournaments"
                  ? "Search tournaments by game or title..."
                  : activeTab === "teammates"
                    ? "Search players, roles, agents, gamer tags..."
                    : "Search lobbies, games, Riot tags, hosts..."
              }
              className="h-10 w-full rounded-2xl border border-border/70 bg-card/70 pl-10 pr-3 text-xs font-medium text-foreground outline-none transition focus:border-primary/50 focus:bg-card"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-bold text-primary hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Game Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {GAMES_LIST.map((g) => {
            const active = selectedGame.toLowerCase() === g.value.toLowerCase();
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setSelectedGame(g.value);
                  sounds.tap();
                  haptics.light();
                }}
                className={cn(
                  "shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold transition border",
                  active
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card/60 text-muted-foreground border-border/50 hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── TAB 1: LOBBIES ─── */}
      {activeTab === "lobbies" && (
        <section className="px-3 pt-3 sm:px-5 space-y-3">
          {/* Format Sub-filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {LOBBY_MODES.map((m) => {
              const active = selectedMode.toUpperCase() === m.value.toUpperCase();
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMode(m.value)}
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition border",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Highlighted Shared Lobby (from ?id=) */}
          {highlightedLobby && (
            <div className="rounded-2xl p-1 bg-gradient-to-r from-primary/30 via-coral/30 to-amber-500/30">
              <div className="bg-background rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                  <Flame className="size-3" />
                  <span>Shared Squad Lobby</span>
                </p>
                <GamingLobbyCard
                  item={highlightedLobby}
                  currentUserId={profileId}
                  onRefresh={() => mutateLobbies()}
                />
              </div>
            </div>
          )}

          {/* Lobbies List */}
          {isLobbiesLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading gaming lobbies...
            </div>
          ) : lobbiesData?.items && lobbiesData.items.length > 0 ? (
            <div className="space-y-3">
              {lobbiesData.items.map((lobby: any) => (
                <GamingLobbyCard
                  key={lobby.id}
                  item={lobby}
                  currentUserId={profileId}
                  onRefresh={() => mutateLobbies()}
                />
              ))}

              {lobbiesData.totalPages > 1 && (
                <div className="flex justify-center pt-2">
                  <Pagination page={lobbiesData.page} totalPages={lobbiesData.totalPages} />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 text-center sm:p-12">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <Gamepad2 className="size-7" />
              </div>
              <h3 className="text-base font-black text-foreground">
                {search ? "No lobbies match this search" : "No open lobbies right now"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {search
                  ? "Try clearing your search filters to browse all open campus lobbies."
                  : "Be the first to open a squad room for Valorant, BGMI, or Chess."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link
                  href="/gaming/new"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90"
                >
                  <Plus className="size-3.5" />
                  <span>Host Squad Lobby</span>
                </Link>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-bold text-foreground"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 2: TOURNAMENTS & BRACKETS ─── */}
      {activeTab === "tournaments" && (
        <section className="px-3 pt-3 sm:px-5 space-y-4">
          {/* Selected Tournament Detail Modal / View */}
          {selectedTournament && (
            <div className="rounded-3xl border border-primary/30 bg-card p-5 space-y-4 shadow-sm relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedTournament(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary mb-1 hover:underline"
                  >
                    <ArrowLeft className="size-3" />
                    <span>Back to all tournaments</span>
                  </button>
                  <h2 className="text-lg font-black text-foreground">
                    {tournamentDetailData?.tournament?.title || selectedTournament.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTournament.gameName} · {selectedTournament.format.replace("_", " ")} · Max{" "}
                    {selectedTournament.maxParticipants} Teams
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Register Button */}
                  {selectedTournament.status === "REGISTRATION_OPEN" &&
                    !tournamentDetailData?.tournament?.userEntry && (
                      <button
                        type="button"
                        disabled={registering}
                        onClick={() => handleRegisterTournament(selectedTournament.slug)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-black text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
                      >
                        {registering ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                        <span>Register Squad</span>
                      </button>
                    )}

                  {/* Generate Bracket Button (Organizer Only) */}
                  {tournamentDetailData?.tournament?.isOrganizer &&
                    selectedTournament.status === "REGISTRATION_OPEN" && (
                      <button
                        type="button"
                        disabled={generatingBracket}
                        onClick={() => handleGenerateBracket(selectedTournament.slug)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 text-xs font-black text-white shadow-xs hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {generatingBracket ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trophy className="size-3.5" />
                        )}
                        <span>Launch & Generate Bracket</span>
                      </button>
                    )}
                </div>
              </div>

              {/* Tournament Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Prize Recognition
                  </p>
                  <p className="font-bold text-foreground truncate mt-0.5">
                    {selectedTournament.prizePool || "Loop Points & Glory"}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Starts At
                  </p>
                  <p className="font-bold text-foreground truncate mt-0.5">
                    {new Date(selectedTournament.startsAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Entries Filled
                  </p>
                  <p className="font-bold text-foreground truncate mt-0.5">
                    {tournamentDetailData?.tournament?.entries?.length ||
                      selectedTournament.currentParticipants}{" "}
                    / {selectedTournament.maxParticipants} Teams
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <p className="font-bold text-primary truncate mt-0.5 uppercase">
                    {tournamentDetailData?.tournament?.status || selectedTournament.status}
                  </p>
                </div>
              </div>

              {/* Rules & Description */}
              {selectedTournament.rules && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/30 whitespace-pre-line leading-relaxed">
                  <span className="font-bold text-foreground block mb-1">Tournament Rules:</span>
                  {selectedTournament.rules}
                </div>
              )}

              {/* Interactive Bracket Tree */}
              <div className="pt-2">
                <TournamentBracketViewer
                  tournamentSlug={selectedTournament.slug}
                  matches={tournamentDetailData?.tournament?.matches || []}
                  isOrganizer={Boolean(tournamentDetailData?.tournament?.isOrganizer)}
                  currentUserId={profileId}
                  onRefresh={() => mutateTournamentDetail()}
                />
              </div>
            </div>
          )}

          {/* Tournaments List Grid */}
          {!selectedTournament && (
            <>
              {isTournamentsLoading ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Loading tournaments...
                </div>
              ) : tournamentsData?.tournaments && tournamentsData.tournaments.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tournamentsData.tournaments.map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTournament(t);
                        sounds.tap();
                        haptics.light();
                      }}
                      className="rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card/90 cursor-pointer shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {t.gameName}
                          </span>
                          <h3 className="text-sm font-black text-foreground mt-1.5 leading-snug">
                            {t.title}
                          </h3>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border",
                            t.status === "REGISTRATION_OPEN"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : t.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/20">
                        <span className="font-semibold">
                          {t.currentParticipants} / {t.maxParticipants} Teams
                        </span>
                        <span className="text-primary font-bold flex items-center gap-1">
                          <span>View Bracket</span>
                          <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 text-center sm:p-12">
                  <Trophy className="mx-auto size-12 text-primary/40 mb-3" />
                  <h3 className="text-base font-black text-foreground">
                    No active tournaments right now
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Campus esports clubs and student hosts organize regular Valorant, BGMI, and
                    Chess tournaments here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsHostTournamentOpen(true)}
                    className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs transition hover:bg-primary/90"
                  >
                    <Trophy className="size-3.5" />
                    <span>Host the First Tournament</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ─── TAB 3: TEAMMATES (LFT) ─── */}
      {activeTab === "teammates" && (
        <section className="px-3 pt-3 sm:px-5 space-y-3">
          {/* LFT Teammates Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div>
              <p className="text-xs font-black text-foreground">Looking For A Squad?</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Set your in-game Riot/Gamer tags and preferred roles to appear here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
            >
              <Shield className="size-3" />
              <span>Edit My Gamer Card</span>
            </button>
          </div>

          {/* Teammates Cards Grid */}
          {isTeammatesLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Finding compatible teammates...
            </div>
          ) : teammatesData?.teammates && teammatesData.teammates.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {teammatesData.teammates.map((teammate: any) => (
                <TeammateCard key={teammate.id} teammate={teammate} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 text-center sm:p-12">
              <Sword className="mx-auto size-12 text-primary/40 mb-3" />
              <h3 className="text-base font-black text-foreground">
                No teammates currently listed for this game
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Activate &quot;Looking For Team&quot; on your Gamer Card to find fellow campus
                players.
              </p>
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs"
              >
                <span>Activate LFT on My Profile</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 4: GAMING FEED & CLIPS ─── */}
      {activeTab === "feed" && (
        <section className="px-3 pt-3 sm:px-5 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/60">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-coral" />
              <span className="text-xs font-bold text-foreground">
                Campus Highlights, Plays & LFG
              </span>
            </div>
            <Link
              href="/post/new?tag=gaming"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs"
            >
              <Plus className="size-3" />
              <span>Share Clip / LFG</span>
            </Link>
          </div>

          {isFeedLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading gaming feed...
            </div>
          ) : feedData?.posts && feedData.posts.length > 0 ? (
            <div className="space-y-3">
              {feedData.posts.map((post: any) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2 hover:border-primary/30 transition shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-full">
                      <AvatarImage src={getAvatarUrl(post.author?.avatarUrl, post.author?.username)} />
                      <AvatarFallback className="text-xs">
                        {post.author?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/@${post.author?.username}`}
                        className="text-xs font-bold text-foreground hover:underline"
                      >
                        {post.author?.displayName}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">
                        @{post.author?.username} · {formatTimeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/20">
                    <span className="text-[10px] font-bold uppercase text-primary">#gaming</span>
                    <Link
                      href={`/post/${post.id}`}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="size-3" />
                      <span>{post.commentsCount || 0} Replies</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 text-center sm:p-12">
              <Flame className="mx-auto size-12 text-coral/40 mb-3" />
              <h3 className="text-base font-black text-foreground">No gaming posts yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Be the first to post your ace clip, match recap, or recruit a squad with #gaming.
              </p>
              <Link
                href="/post/new?tag=gaming"
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>Post Gaming Clip</span>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 5: LEADERBOARD & RANKINGS ─── */}
      {activeTab === "leaderboard" && (
        <section className="px-3 pt-3 sm:px-5 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/60">
            <div>
              <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Medal className="size-4 text-amber-500" />
                <span>Seasonal Campus Rankings · 2026-S1</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Points are earned through verified tournament wins (+50 LP) and runner-up finishes
                (+25 LP).
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-black text-amber-500 border border-amber-500/20">
              Season 1
            </span>
          </div>

          {isLeaderboardLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading rankings...
            </div>
          ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/60 divide-y divide-border/20 shadow-2xs">
              {leaderboardData.leaderboard.map((player: any) => (
                <div key={player.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "size-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black",
                        player.rank === 1
                          ? "bg-amber-500 text-white shadow-xs"
                          : player.rank === 2
                            ? "bg-slate-300 text-slate-800"
                            : player.rank === 3
                              ? "bg-amber-700/80 text-white"
                              : "bg-muted text-muted-foreground"
                      )}
                    >
                      {player.rank}
                    </span>

                    <Avatar className="size-8 rounded-full border border-border/40 shrink-0">
                      <AvatarImage
                        src={getAvatarUrl(player.user?.avatarUrl, player.user?.username)}
                      />
                      <AvatarFallback className="text-xs">
                        {player.user?.displayName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {player.user?.displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{player.user?.username} · {player.institution?.name?.split(",")[0]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-primary tabular-nums">
                      {player.rankingPoints} LP
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {player.tournamentsWon} Cups Won · {player.winRate}% Win
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-8 text-center sm:p-12">
              <Medal className="mx-auto size-12 text-amber-500/40 mb-3" />
              <h3 className="text-base font-black text-foreground">
                Season 1 Leaderboard is Live
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Compete in campus tournaments and verified matches to establish your ranking on the
                board.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("tournaments")}
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground shadow-xs"
              >
                <Trophy className="size-3.5" />
                <span>Join a Tournament to Rank Up</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── Modals / Dialogs ─── */}
      <GamerProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onSaved={() => {
          mutateTeammates();
        }}
      />

      <HostTournamentDialog
        open={isHostTournamentOpen}
        onOpenChange={setIsHostTournamentOpen}
        onCreated={(newTournament) => {
          mutateTournaments();
          setSelectedTournament(newTournament);
        }}
      />
    </main>
  );
}

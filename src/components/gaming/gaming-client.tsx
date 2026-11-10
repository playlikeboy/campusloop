/* biome-ignore-all lint/suspicious/noExplicitAny: the gaming APIs return untyped payloads */
"use client";

import { Plus, Search, Shield, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { GamerProfileDialog } from "@/components/gaming/gamer-profile-dialog";
import { HostTournamentDialog } from "@/components/gaming/host-tournament-dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { ChipRow, FeedPanel, LeaderboardPanel, LobbiesPanel, TeammatesPanel } from "./gaming-panels";
import { TournamentsPanel } from "./tournaments-panel";

interface GamingClientProps {
  profileId: string;
}

type GamingTab = "lobbies" | "tournaments" | "teammates" | "feed" | "leaderboard";

const TABS: { id: GamingTab; label: string }[] = [
  { id: "lobbies", label: "Lobbies" },
  { id: "tournaments", label: "Tournaments" },
  { id: "teammates", label: "Find teammates" },
  { id: "feed", label: "Clips" },
  { id: "leaderboard", label: "Rankings" },
];

const GAMES_LIST = [
  { label: "All games", value: "all" },
  { label: "Valorant", value: "Valorant" },
  { label: "BGMI", value: "BGMI" },
  { label: "Chess", value: "Chess" },
  { label: "EA FC", value: "EA FC" },
  { label: "CS2", value: "CS2" },
  { label: "Rocket League", value: "Rocket League" },
];

const LOBBY_MODES = [
  { label: "Any format", value: "all" },
  { label: "5v5", value: "5V5" },
  { label: "1v1", value: "1V1" },
  { label: "Scrim", value: "SCRIM" },
  { label: "Ranked", value: "RANKED" },
  { label: "Casual", value: "CASUAL" },
];

const SEARCH_HINT: Record<GamingTab, string> = {
  lobbies: "Search lobbies, games or hosts",
  tournaments: "Search tournaments",
  teammates: "Search players, roles or game tags",
  feed: "Search lobbies, games or hosts",
  leaderboard: "Search lobbies, games or hosts",
};

async function postJson(url: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export function GamingClient({ profileId }: GamingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as GamingTab | null;
  const [activeTab, setActiveTab] = useState<GamingTab>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "lobbies"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [scope, setScope] = useState<"all" | "campus">("campus");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHostTournamentOpen, setIsHostTournamentOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [registering, setRegistering] = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);

  const handleTabChange = useCallback(
    (tab: GamingTab) => {
      setActiveTab(tab);
      haptics.light();
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const q = search.trim();
  const lobbiesUrl = useMemo(() => {
    const p = new URLSearchParams({ game: selectedGame, mode: selectedMode, scope, limit: "16" });
    if (q) p.set("q", q);
    return `/api/gaming/lobbies?${p.toString()}`;
  }, [selectedGame, selectedMode, scope, q]);
  const tournamentsUrl = useMemo(() => {
    const p = new URLSearchParams({ game: selectedGame, scope, limit: "12" });
    if (q) p.set("q", q);
    return `/api/gaming/tournaments?${p.toString()}`;
  }, [selectedGame, scope, q]);
  const teammatesUrl = useMemo(() => {
    const p = new URLSearchParams({ game: selectedGame, scope, limit: "24" });
    if (q) p.set("q", q);
    return `/api/gaming/teammates?${p.toString()}`;
  }, [selectedGame, scope, q]);
  const leaderboardGame = selectedGame === "all" ? "Valorant" : selectedGame;
  const leaderboardUrl = `/api/gaming/progression?${new URLSearchParams({ game: leaderboardGame, scope, season: "2026-S1" }).toString()}`;

  const swrOpts = { revalidateOnFocus: true };
  const lobbies = useSWR<any>(activeTab === "lobbies" ? lobbiesUrl : null, fetcher, swrOpts);
  const tournaments = useSWR<any>(activeTab === "tournaments" ? tournamentsUrl : null, fetcher, swrOpts);
  const tournamentDetail = useSWR<any>(
    selectedTournament ? `/api/gaming/tournaments/${selectedTournament.slug}` : null,
    fetcher,
    swrOpts
  );
  const teammates = useSWR<any>(activeTab === "teammates" ? teammatesUrl : null, fetcher, swrOpts);
  const feed = useSWR<any>(activeTab === "feed" ? "/api/feed?tab=gaming&limit=15" : null, fetcher, swrOpts);
  const leaderboard = useSWR<any>(activeTab === "leaderboard" ? leaderboardUrl : null, fetcher, swrOpts);

  const urlLobbyId = searchParams.get("id");
  const highlightedLobby = useMemo(() => {
    if (!urlLobbyId || !lobbies.data?.items) return null;
    return lobbies.data.items.find((item: any) => item.id === urlLobbyId) ?? null;
  }, [urlLobbyId, lobbies.data]);

  async function handleRegisterTournament(slug: string) {
    if (registering) return;
    setRegistering(true);
    haptics.light();
    try {
      await postJson(`/api/gaming/tournaments/${slug}/register`);
      toast.success("You're in the tournament.");
      void tournamentDetail.mutate();
      void tournaments.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join. Try again.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleGenerateBracket(slug: string) {
    if (generatingBracket) return;
    setGeneratingBracket(true);
    sounds.match();
    haptics.match();
    try {
      await postJson(`/api/gaming/tournaments/${slug}/bracket`);
      toast.success("Bracket ready. Matches are below.");
      void tournamentDetail.mutate();
      void tournaments.mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't make the bracket. Try again.");
    } finally {
      setGeneratingBracket(false);
    }
  }

  const showFilters = activeTab !== "feed";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-4 pb-28 sm:px-0 sm:pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold text-fg">Gaming</h1>
          <p className="mt-1 text-sm text-fg-muted">Find people to play with at your college.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="circleIcon"
            size="icon"
            onClick={() => setIsProfileOpen(true)}
            aria-label="Edit gamer card"
            title="Edit gamer card"
          >
            <Shield />
          </Button>
          {activeTab === "tournaments" ? (
            <Button onClick={() => setIsHostTournamentOpen(true)}>
              <Trophy aria-hidden /> Host
            </Button>
          ) : (
            <Button asChild>
              <Link href="/gaming/new">
                <Plus aria-hidden /> Start lobby
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as GamingTab)}>
        <TabsList
          variant="line"
          className="no-scrollbar -mx-4 w-[calc(100%+2rem)] justify-start overflow-x-auto px-4 sm:mx-0 sm:w-full sm:px-0"
        >
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="shrink-0">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {showFilters && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle"
                aria-hidden
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={SEARCH_HINT[activeTab]}
                aria-label={SEARCH_HINT[activeTab]}
                className="rounded-full pr-12 pl-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute top-0 right-0"
                >
                  <X />
                </Button>
              )}
            </div>
            <SegmentedControl
              className="self-start"
              aria-label="Where"
              value={scope}
              onChange={setScope}
              options={[
                { value: "campus", label: "My college" },
                { value: "all", label: "All" },
              ]}
            />
          </div>
          <ChipRow label="Game">
            {GAMES_LIST.map((g) => (
              <Chip
                key={g.value}
                size="sm"
                selected={selectedGame === g.value}
                onClick={() => setSelectedGame(g.value)}
              >
                {g.label}
              </Chip>
            ))}
          </ChipRow>
          {activeTab === "lobbies" && (
            <ChipRow label="Format">
              {LOBBY_MODES.map((m) => (
                <Chip
                  key={m.value}
                  size="sm"
                  selected={selectedMode === m.value}
                  onClick={() => setSelectedMode(m.value)}
                >
                  {m.label}
                </Chip>
              ))}
            </ChipRow>
          )}
        </div>
      )}

      {activeTab === "lobbies" && (
        <LobbiesPanel
          data={lobbies.data}
          error={lobbies.error}
          isLoading={lobbies.isLoading}
          highlighted={highlightedLobby}
          profileId={profileId}
          search={q}
          onClearSearch={() => setSearch("")}
          onRefresh={() => void lobbies.mutate()}
        />
      )}
      {activeTab === "tournaments" && (
        <TournamentsPanel
          data={tournaments.data}
          error={tournaments.error}
          isLoading={tournaments.isLoading}
          selected={selectedTournament}
          detail={tournamentDetail.data}
          profileId={profileId}
          registering={registering}
          generating={generatingBracket}
          onSelect={setSelectedTournament}
          onRegister={handleRegisterTournament}
          onGenerate={handleGenerateBracket}
          onRefreshDetail={() => void tournamentDetail.mutate()}
          onHost={() => setIsHostTournamentOpen(true)}
          onRetry={() => void tournaments.mutate()}
        />
      )}
      {activeTab === "teammates" && (
        <TeammatesPanel
          data={teammates.data}
          error={teammates.error}
          isLoading={teammates.isLoading}
          onEditCard={() => setIsProfileOpen(true)}
          onRetry={() => void teammates.mutate()}
        />
      )}
      {activeTab === "feed" && (
        <FeedPanel
          data={feed.data}
          error={feed.error}
          isLoading={feed.isLoading}
          onRetry={() => void feed.mutate()}
        />
      )}
      {activeTab === "leaderboard" && (
        <LeaderboardPanel
          data={leaderboard.data}
          error={leaderboard.error}
          isLoading={leaderboard.isLoading}
          gameLabel={leaderboardGame}
          onFindTournament={() => handleTabChange("tournaments")}
          onRetry={() => void leaderboard.mutate()}
        />
      )}

      <GamerProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onSaved={() => void teammates.mutate()}
      />
      <HostTournamentDialog
        open={isHostTournamentOpen}
        onOpenChange={setIsHostTournamentOpen}
        onCreated={(newTournament) => {
          void tournaments.mutate();
          setSelectedTournament(newTournament);
        }}
      />
    </div>
  );
}

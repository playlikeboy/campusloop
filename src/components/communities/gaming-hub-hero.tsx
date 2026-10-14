"use client";

import { Brain, Crosshair, Gamepad2, Search, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamingHubHeroProps {
  search: string;
  onSearchChange: (value: string) => void;
}

const GAME_SEARCHES = [
  { label: "Valorant", icon: Crosshair },
  { label: "BGMI", icon: Gamepad2 },
  { label: "Chess", icon: Brain },
  { label: "EA FC", icon: Trophy },
];

export function GamingHubHero({ search, onSearchChange }: GamingHubHeroProps) {
  const activeSearch = search.trim().toLowerCase();

  return (
    <section className="px-3 pb-5 sm:px-5">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-[var(--surface)] shadow-sm ring-1 ring-border/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-coral/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-1/4 size-52 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.82fr)] md:items-center md:gap-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              Campus gaming
            </div>

            <h2 className="mt-4 max-w-lg text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
              Your next great game starts with a{" "}
              <span className="text-primary">squad.</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Find students who play your games, join an open lobby, or create one for your next campus scrim.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border/70">
                  <Users className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Find your teammates</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Connect around the games you already love.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border/70">
                  <Trophy className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Make the first move</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Start a lobby and bring your campus together.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-background/85 p-4 shadow-xs ring-1 ring-border/70 backdrop-blur-sm sm:p-5">
            <label
              htmlFor="gaming-hub-search"
              className="text-sm font-bold tracking-tight text-foreground"
            >
              Find a lobby
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Search by game or browse everything open.
            </p>

            <div className="relative mt-3">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="gaming-hub-search"
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search games, players, or lobbies"
                autoComplete="off"
                aria-label="Search gaming lobbies"
                className="h-11 w-full rounded-xl border border-border/70 bg-[var(--surface)] pl-10 pr-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Quick search
              </p>
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="min-h-8 rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!activeSearch}
                onClick={() => onSearchChange("")}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  !activeSearch
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 bg-[var(--surface)] text-foreground hover:bg-muted/70"
                )}
              >
                <Gamepad2 className="size-4 shrink-0" aria-hidden="true" />
                <span>All lobbies</span>
              </button>
              {GAME_SEARCHES.map(({ label, icon: Icon }) => {
                const active = activeSearch === label.toLowerCase();

                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSearchChange(active ? "" : label)}
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/70 bg-[var(--surface)] text-foreground hover:bg-muted/70"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

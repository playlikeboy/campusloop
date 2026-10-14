import { Crosshair, Gamepad2, Swords, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MODE_FILTERS = [
  { value: "all", label: "All open", detail: "Find any available squad", icon: Gamepad2 },
  { value: "competitive", label: "Competitive", detail: "Ranked team play", icon: Crosshair },
  { value: "casual", label: "Casual", detail: "Low-pressure games", icon: Users },
  { value: "scrim", label: "Scrims", detail: "Practice with a team", icon: Swords },
  { value: "tournament", label: "Tournament lobbies", detail: "Organized match listings", icon: Trophy },
] as const;

interface GamingDiscoveryFiltersProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

export function GamingDiscoveryFilters({ activeMode, onModeChange }: GamingDiscoveryFiltersProps) {
  return (
    <section className="px-3 pb-4 sm:px-5" aria-label="Gaming lobby filters">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <h2 className="text-sm font-extrabold tracking-tight text-foreground">Play your way</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Filter real open lobbies by the kind of match you want.
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Campus matches</span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by lobby mode">
        {MODE_FILTERS.map(({ value, label, detail, icon: Icon }) => {
          const active = activeMode === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onModeChange(value)}
              className={cn(
                "flex min-h-12 shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/70 text-foreground hover:bg-muted/60"
              )}
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-background/80">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-extrabold">{label}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">{detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

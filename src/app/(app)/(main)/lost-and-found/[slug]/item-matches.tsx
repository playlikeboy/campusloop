import { MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MatchItem {
  id: string;
  slug?: string | null;
  type?: "LOST" | "FOUND";
  title: string;
  category?: string;
  location?: string;
}

interface ItemMatchesProps {
  isLost: boolean;
  category: string;
  potentialMatches: MatchItem[];
  similarReports: MatchItem[];
}

function MatchRow({ item, showType }: { item: MatchItem; showType: boolean }) {
  return (
    <li>
      <Link
        href={`/lost-and-found/${item.slug || item.id}`}
        className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{item.title}</p>
          {item.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.location}</span>
            </p>
          )}
        </div>
        {showType && item.type ? (
          <Badge variant={item.type === "LOST" ? "warning" : "neutral"}>
            {item.type === "LOST" ? "Lost" : "Found"}
          </Badge>
        ) : item.category ? (
          <span className="shrink-0 text-xs text-fg-subtle">{item.category}</span>
        ) : null}
      </Link>
    </li>
  );
}

/** Reports that might be the other half of this one, plus similar reports. */
export function ItemMatches({ isLost, category, potentialMatches, similarReports }: ItemMatchesProps) {
  if (potentialMatches.length === 0 && similarReports.length === 0) {
    return (
      <section aria-labelledby="matches-heading" className="space-y-1 border-t border-border pt-6">
        <h2 id="matches-heading" className="text-lg text-fg">
          Possible matches
        </h2>
        <p className="text-sm text-fg-muted">
          None yet. If someone reports a {isLost ? "found" : "lost"} item like this ({category}), it shows up
          here.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6 border-t border-border pt-6">
      {potentialMatches.length > 0 && (
        <section aria-labelledby="matches-heading" className="space-y-3">
          <div>
            <h2 id="matches-heading" className="text-lg text-fg">
              Possible matches
            </h2>
            <p className="text-sm text-fg-muted">
              {isLost ? "Found" : "Lost"} reports that look like this one. Open them to check.
            </p>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {potentialMatches.map((m) => (
              <MatchRow key={m.id} item={m} showType />
            ))}
          </ul>
        </section>
      )}

      {similarReports.length > 0 && (
        <section aria-labelledby="similar-heading" className="space-y-3">
          <h2 id="similar-heading" className="text-lg text-fg">
            Similar reports
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {similarReports.map((s) => (
              <MatchRow key={s.id} item={s} showType={false} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { getRankingExperimentReadout } from "@/lib/recommendations/experiment-readout";
import { RANKING_EXPERIMENT } from "@/lib/recommendations/experiments";
import { privateMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "../_components/admin-page-header";
import { resolveAdminSession } from "../_lib/guard";

export const metadata: Metadata = privateMetadata("Ranking experiments");

export const dynamic = "force-dynamic";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const num = (v: number) => v.toFixed(2);

function Verdict({ z, lowerIsBetter, label }: { z: number; lowerIsBetter?: boolean; label: string }) {
  const significant = Math.abs(z) >= 1.96;
  const better = lowerIsBetter ? z < 0 : z > 0;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <p className="mt-1 font-sans text-xl font-semibold tabular-nums text-fg">z = {z.toFixed(2)}</p>
      <p
        className={cn(
          "mt-1 text-sm font-medium",
          !significant ? "text-fg-muted" : better ? "text-success" : "text-danger"
        )}
      >
        {!significant
          ? "Not significant yet (need |z| of 1.96 or more)"
          : better
            ? "Personalised feed is better"
            : "Personalised feed is worse"}
      </p>
    </div>
  );
}

export default async function AdminExperimentsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await resolveAdminSession();
  const { days: daysParam } = await searchParams;
  const days = [1, 7, 14, 30].includes(Number(daysParam)) ? Number(daysParam) : 7;

  let readout: Awaited<ReturnType<typeof getRankingExperimentReadout>> | null = null;
  let loadError = false;
  try {
    readout = await getRankingExperimentReadout(days);
  } catch (err) {
    console.error("[admin/experiments] readout failed:", err);
    loadError = true;
  }

  const rows: {
    label: string;
    render: (a: NonNullable<typeof readout>["arms"][number]) => string;
    hint: string;
  }[] = [
    {
      label: "Students exposed",
      render: (a) => String(a.users),
      hint: "Distinct viewers with feed impressions",
    },
    { label: "Impressions", render: (a) => String(a.impressions), hint: "Posts at least half on screen" },
    { label: "Avg dwell", render: (a) => secs(a.avgDwellMs), hint: "Higher is better" },
    { label: "Skip rate", render: (a) => pct(a.skipRate), hint: "Under 1.2s on screen. Lower is better" },
    {
      label: "Long reads",
      render: (a) => pct(a.longDwellRate),
      hint: "8s or more on screen. Higher is better",
    },
    { label: "Votes / student", render: (a) => num(a.votesPerUser), hint: "All votes in the window" },
    {
      label: "Comments / student",
      render: (a) => num(a.commentsPerUser),
      hint: "All comments in the window",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Ranking experiments"
        icon={FlaskConical}
        description={`Experiment "${RANKING_EXPERIMENT.id}": ${RANKING_EXPERIMENT.treatmentPercent}% of students get the personalised For You feed. Everyone else gets the standard feed.`}
      />

      <nav className="flex flex-wrap gap-2" aria-label="Time window">
        {[1, 7, 14, 30].map((d) => (
          <a
            key={d}
            href={`/admin/experiments?days=${d}`}
            aria-current={d === days ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              d === days
                ? "bg-brand text-brand-fg"
                : "border border-border bg-surface text-fg hover:bg-surface-muted"
            )}
          >
            Last {d} {d === 1 ? "day" : "days"}
          </a>
        ))}
      </nav>

      {loadError || !readout ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-subtle p-5 text-sm text-danger"
        >
          Couldn't load experiment data. Check the database on the System health page, then reload.
        </div>
      ) : readout.arms.every((a) => a.impressions === 0) ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <FlaskConical className="mx-auto size-8 text-fg-muted" aria-hidden />
          <p className="mt-3 font-semibold text-fg">No impressions yet</p>
          <p className="mt-1 text-sm text-fg-muted">
            Impressions are recorded as students scroll the feed. Check back later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Verdict z={readout.skipRateZ} lowerIsBetter label="Skip rate, personalized vs control" />
            <Verdict z={readout.longDwellZ} label="Long-read rate, personalized vs control" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted">
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  {readout.arms.map((a) => (
                    <th key={a.variant} className="px-4 py-3 font-semibold capitalize">
                      {a.variant}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{row.label}</p>
                      <p className="text-xs text-fg-muted">{row.hint}</p>
                    </td>
                    {readout.arms.map((a) => (
                      <td key={a.variant} className="px-4 py-3 font-semibold tabular-nums text-fg">
                        {row.render(a)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

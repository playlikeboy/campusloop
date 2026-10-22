import { ChevronRight, Clock, LogIn, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { OauthClient } from "@/db/schema";

const REVIEW: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Extra access in review", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  APPROVED: { label: "Extra access approved", tone: "bg-primary/10 text-primary" },
  REJECTED: { label: "Extra access declined", tone: "bg-destructive/10 text-destructive" },
};

/** Developer portal: the student's Login with CampusLoop apps. */
export function AppsSection({ apps }: { apps: OauthClient[] }) {
  return (
    <section className="mb-8 rounded-3xl bg-card/60 p-5 shadow-2xs" aria-labelledby="oauth-apps">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="oauth-apps" className="flex items-center gap-2 text-lg font-bold text-foreground"><LogIn className="size-5 text-primary" aria-hidden /> Login with CampusLoop</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Add a sign-in button to your website or app that tells you whether someone is a verified college student. <Link href="/developers" className="font-semibold text-primary hover:underline">Read the docs</Link></p>
        </div>
        <Link href="/developer/apps/new" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90">
          <Plus className="size-4" aria-hidden /> New app
        </Link>
      </div>
      {apps.length > 0 && (
        <ul className="mt-4 divide-y divide-border/40">
          {apps.map((a) => (
            <li key={a.id}>
              <Link href={`/developer/apps/${a.id}`} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted/40">
                {a.logoUrl ? <img src={a.logoUrl} alt="" className="size-10 rounded-xl object-cover" /> : <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{a.name.charAt(0).toUpperCase()}</span>}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
                    {a.name} {a.isFirstParty && <ShieldCheck className="size-4 text-primary" aria-label="Ecosystem app" />}
                    {a.status === "SUSPENDED" && <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive">Suspended</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <code className="font-mono">{a.id}</code>
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{a.usersCount} students</span>
                    {REVIEW[a.reviewStatus] && <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${REVIEW[a.reviewStatus].tone}`}><Clock className="size-3" aria-hidden />{REVIEW[a.reviewStatus].label}</span>}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { ChevronRight, LogIn, Plus, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { OauthClient } from "@/db/schema";

/** Developer portal: the student's Login with CampusLoop apps. */
export function AppsSection({ apps }: { apps: OauthClient[] }) {
  return (
    <section className="mb-8 rounded-lg border border-border bg-surface p-5" aria-labelledby="oauth-apps">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="oauth-apps" className="flex items-center gap-2 text-lg text-fg">
            <LogIn className="size-5 text-fg-muted" aria-hidden /> Login with CampusLoop
          </h2>
          <p className="mt-1 max-w-xl text-sm text-fg-muted">
            Add a sign-in button to your website or app that tells you whether someone is a verified college
            student.{" "}
            <Link href="/developers" className="font-semibold text-brand-text hover:underline">
              Read the docs
            </Link>
          </p>
        </div>
        <Link
          href="/developer/apps/new"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg transition-ui hover:bg-brand-hover"
        >
          <Plus className="size-4" aria-hidden /> New app
        </Link>
      </div>
      {apps.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {apps.map((a) => (
            <li key={a.id}>
              <Link
                href={`/developer/apps/${a.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-3 transition-ui hover:bg-surface-muted"
              >
                {a.logoUrl ? (
                  <img src={a.logoUrl} alt="" className="size-10 rounded-sm object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-sm bg-brand-subtle font-semibold text-brand-text">
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-fg">
                    {a.name}{" "}
                    {a.isFirstParty && (
                      <ShieldCheck
                        className="size-4 text-verified-text"
                        aria-label="Official CampusLoop app"
                      />
                    )}
                    {a.status === "SUSPENDED" && (
                      <span className="rounded-full bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger">
                        Suspended
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-fg-muted">
                    <code className="font-mono">{a.id}</code>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden />
                      {a.usersCount} students
                    </span>
                  </p>
                </div>
                <ChevronRight className="size-4 text-fg-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

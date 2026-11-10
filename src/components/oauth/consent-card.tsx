import {
  ArrowLeftRight,
  BadgeCheck,
  GraduationCap,
  KeyRound,
  Mail,
  RefreshCcw,
  School,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { OauthClient } from "@/db/schema";
import { SCOPES } from "@/lib/oauth/config";
import { ConsentButtons } from "./consent-buttons";

const ICONS: Record<string, typeof KeyRound> = {
  openid: KeyRound,
  profile: UserRound,
  student: BadgeCheck,
  college: School,
  academic: GraduationCap,
  email: Mail,
  offline_access: RefreshCcw,
};

interface Props {
  client: OauthClient;
  scopes: string[];
  redirectHost: string;
  request: string;
  account: { displayName: string; username: string; avatarUrl: string | null; verified: boolean };
  switchHref: string;
  action: (formData: FormData) => Promise<void>;
}

function AppMark({ client }: { client: OauthClient }) {
  return client.logoUrl ? (
    <img src={client.logoUrl} alt="" className="size-14 rounded-lg object-cover shadow-sticker" />
  ) : (
    <span className="flex size-14 items-center justify-center rounded-lg bg-brand-subtle text-xl font-bold text-brand-text">
      {client.name.charAt(0).toUpperCase()}
    </span>
  );
}

/** "Login with CampusLoop" consent screen. Server-rendered; works without JavaScript. */
export function ConsentCard({ client, scopes, redirectHost, request, account, switchHref, action }: Props) {
  const reviewed = client.isFirstParty || client.reviewStatus === "APPROVED";
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3" aria-hidden>
          <img
            src="/logo.png"
            alt=""
            className="size-14 rounded-lg bg-surface object-contain p-2 shadow-sticker"
          />
          <ArrowLeftRight className="size-5 text-fg-muted" />
          <AppMark client={client} />
        </div>

        <h1 className="mt-6 text-center text-3xl text-fg">Sign in to {client.name}</h1>
        <p className="mt-1 text-center text-sm text-fg-muted">with your CampusLoop account</p>

        <section className="mt-6 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold">
                {account.displayName.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-semibold text-fg">
                {account.displayName} {account.verified && <VerifiedBadge size="sm" />}
              </p>
              <p className="truncate text-xs text-fg-muted">@{account.username}</p>
            </div>
            <a
              href={switchHref}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-brand-text transition-ui hover:bg-brand-subtle"
            >
              Not you?
            </a>
          </div>

          <p className="mt-5 text-sm font-semibold text-fg">{client.name} wants to:</p>
          <ul className="mt-2 space-y-2.5">
            {scopes.map((s) => {
              const Icon = ICONS[s] ?? KeyRound;
              return (
                <li key={s} className="flex items-start gap-3 text-sm text-fg">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="pt-1">{SCOPES[s]?.consent ?? s}</span>
                </li>
              );
            })}
          </ul>

          {!reviewed && (
            <p className="mt-5 flex gap-2 rounded-md bg-warning-subtle p-3 text-sm text-warning">
              <ShieldAlert className="size-4 shrink-0" aria-hidden />
              CampusLoop hasn&apos;t reviewed this app yet. Only continue if you trust {redirectHost}.
            </p>
          )}

          <form action={action} className="mt-6">
            <input type="hidden" name="request" value={request} />
            <ConsentButtons appName={client.name} />
          </form>
        </section>

        <p className="mt-4 text-center text-xs leading-relaxed text-fg-muted">
          You&apos;ll be sent to <span className="font-semibold text-fg">{redirectHost}</span>.
          {(client.privacyUrl || client.termsUrl) && " Read its "}
          {client.privacyUrl && (
            <a
              href={client.privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-fg underline"
            >
              privacy policy
            </a>
          )}
          {client.privacyUrl && client.termsUrl && " and "}
          {client.termsUrl && (
            <a
              href={client.termsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-fg underline"
            >
              terms
            </a>
          )}
          {(client.privacyUrl || client.termsUrl) && "."} You can remove access anytime in Settings, Connected
          apps.
        </p>
      </div>
    </main>
  );
}

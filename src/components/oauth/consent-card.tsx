import { ArrowLeftRight, BadgeCheck, GraduationCap, KeyRound, Mail, RefreshCcw, School, ShieldAlert, UserRound } from "lucide-react";
import type { OauthClient } from "@/db/schema";
import { SCOPES } from "@/lib/oauth/config";
import { VerifiedBadge } from "@/components/ui/verified-badge";
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
    <img src={client.logoUrl} alt="" className="size-14 rounded-2xl object-cover shadow-sm" />
  ) : (
    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">{client.name.charAt(0).toUpperCase()}</span>
  );
}

/** "Login with CampusLoop" consent screen. Server-rendered; works without JavaScript. */
export function ConsentCard({ client, scopes, redirectHost, request, account, switchHref, action }: Props) {
  const reviewed = client.isFirstParty || client.reviewStatus === "APPROVED";
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3" aria-hidden>
          <img src="/logo.png" alt="" className="size-14 rounded-2xl bg-card object-contain p-2 shadow-sm" />
          <ArrowLeftRight className="size-5 text-muted-foreground" />
          <AppMark client={client} />
        </div>

        <h1 className="mt-6 text-center text-2xl font-black tracking-tight text-foreground">Sign in to {client.name}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">with your CampusLoop account</p>

        <section className="mt-6 rounded-3xl bg-card/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold">{account.displayName.charAt(0)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
                {account.displayName} {account.verified && <VerifiedBadge size="sm" />}
              </p>
              <p className="truncate text-xs text-muted-foreground">@{account.username}</p>
            </div>
            <a href={switchHref} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Not you?</a>
          </div>

          <p className="mt-5 text-sm font-semibold text-foreground">{client.name} wants to:</p>
          <ul className="mt-2 space-y-2.5">
            {scopes.map((s) => {
              const Icon = ICONS[s] ?? KeyRound;
              return (
                <li key={s} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
                  <span className="pt-1">{SCOPES[s]?.consent ?? s}</span>
                </li>
              );
            })}
          </ul>

          {!reviewed && (
            <p className="mt-5 flex gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              <ShieldAlert className="size-4 shrink-0" aria-hidden />
              CampusLoop hasn&apos;t reviewed this app yet. Only continue if you trust {redirectHost}.
            </p>
          )}

          <form action={action} className="mt-6">
            <input type="hidden" name="request" value={request} />
            <ConsentButtons appName={client.name} />
          </form>
        </section>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          You&apos;ll be sent to <span className="font-semibold text-foreground">{redirectHost}</span>.
          {(client.privacyUrl || client.termsUrl) && " Read its "}
          {client.privacyUrl && <a href={client.privacyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline">privacy policy</a>}
          {client.privacyUrl && client.termsUrl && " and "}
          {client.termsUrl && <a href={client.termsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline">terms</a>}
          {(client.privacyUrl || client.termsUrl) && "."} You can remove access anytime in Settings, Connected apps.
        </p>
      </div>
    </main>
  );
}

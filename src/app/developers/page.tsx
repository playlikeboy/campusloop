import { ArrowRight, BadgeCheck, Fingerprint, MousePointerClick, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CTABand, MarketingFooter, MarketingHeader } from "@/components/marketing/system";
import { Quickstart } from "@/components/oauth/quickstart";
import { ENDPOINTS, ISSUER, SCOPES } from "@/lib/oauth/config";

const URL_ = "https://campusloop.space/developers";

export const metadata: Metadata = {
  title: "Login with CampusLoop: verified-student sign-in for your app",
  description:
    "Add a Login with CampusLoop button to your website or app. Standard OpenID Connect with PKCE: sign students in with one click and know whether they are verified college students in India.",
  keywords: ["login with campusloop", "student verification API", "verified student login", "OpenID Connect provider India", "student discount verification", "OAuth student login"],
  alternates: { canonical: URL_ },
  openGraph: { title: "Login with CampusLoop for developers", description: "One-click sign-in that tells you who's a verified college student.", url: URL_, siteName: "CampusLoop", type: "website" },
};

const WHY = [
  { icon: BadgeCheck, title: "Know who's a real student", body: "Every token says whether the person signed up with a verified college email. Gate student discounts, hackathons or campus-only features without collecting ID cards." },
  { icon: MousePointerClick, title: "One tap for students", body: "Students already have CampusLoop. No new password, no form, and after the first time no consent screen either." },
  { icon: Fingerprint, title: "Private by default", body: "Apps get a per-app anonymous ID, plus only the scopes the student approves. College, branch and email need our review." },
  { icon: ShieldCheck, title: "Standard and secure", body: "OpenID Connect with Authorization Code + PKCE, ES256-signed tokens and rotating refresh tokens. Any OIDC library works." },
];

const FAQ = [
  ["Is it free?", "Yes. Registering apps and signing students in is free."],
  ["Which libraries work?", "Anything that speaks OpenID Connect: Auth.js / NextAuth, Clerk and Supabase custom OIDC providers, Firebase OIDC, Passport, openid-client, Spring Security, Django allauth and more. Use the issuer URL and they discover everything."],
  ["How do I know someone is a verified student?", "Request the student scope and read the student_verified claim from the id_token or /oauth/userinfo. It is true only for accounts verified with a college email."],
  ["Can I get the student's college or email?", "Yes, after review. Tick college, academic or email when registering, and add a privacy policy. Until approved, those scopes are simply left out of tokens."],
  ["Why is sub different from the student's CampusLoop ID?", "Each app gets its own stable, anonymous subject so apps can't track students across sites. Store sub as the user key."],
  ["What if a student removes my app?", "Their refresh tokens stop working and /oauth/userinfo returns invalid_token. Treat that as signed out."],
] as const;

export default function DevelopersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Login with CampusLoop: developer documentation",
    url: URL_,
    about: "OpenID Connect provider for verified college students in India",
    publisher: { "@type": "Organization", name: "CampusLoop", url: "https://campusloop.space" },
    mainEntity: { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
        <MarketingHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
          <header className="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <p className="text-sm font-semibold text-primary">For developers</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.06]">Login with CampusLoop</h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Add one button and instantly know whether your users are verified college students. Built on OpenID Connect, so it plugs into the auth library you already use.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/developer/apps/new" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90">
                  Register your app <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a href="#quickstart" className="inline-flex h-12 items-center rounded-2xl bg-muted/70 px-5 text-sm font-semibold hover:bg-muted">5-minute quickstart</a>
              </div>
            </div>
            <div className="rounded-3xl bg-card/70 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Official buttons</p>
              <div className="mt-4 space-y-3">
                <img src="/oauth/button-light.svg" alt="Continue with CampusLoop button, light" width={280} height={48} />
                <img src="/oauth/button-dark.svg" alt="Continue with CampusLoop button, dark" width={280} height={48} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Download: <a className="underline" href="/oauth/button-light.svg" download>light</a> · <a className="underline" href="/oauth/button-dark.svg" download>dark</a> · <a className="underline" href="/oauth/icon.svg" download>icon</a></p>
            </div>
          </header>

          <section aria-labelledby="why" className="mt-16">
            <h2 id="why" className="text-2xl font-bold">Why add it</h2>
            <ul className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {WHY.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
                  <span><span className="block font-bold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span></span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="quickstart-title" id="quickstart" className="mt-16 scroll-mt-24">
            <h2 id="quickstart-title" className="text-2xl font-bold">Quickstart</h2>
            <ol className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li><strong className="text-foreground">1. Register.</strong> Open <Link href="/developer/apps/new" className="font-semibold text-primary hover:underline">/developer/apps/new</Link>, choose web app (server) or browser/mobile app, and add your redirect URIs.</li>
              <li><strong className="text-foreground">2. Configure.</strong> Point your OIDC library at the issuer <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{ISSUER}</code> with your client ID (and secret).</li>
              <li><strong className="text-foreground">3. Read the claims.</strong> Use <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">sub</code> as the user ID and <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">student_verified</code> to unlock student features.</li>
            </ol>
            <div id="verify" className="mt-6 scroll-mt-24"><Quickstart /></div>
          </section>

          <section aria-labelledby="scopes" className="mt-16">
            <h2 id="scopes" className="text-2xl font-bold">Scopes and claims</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-card/60 shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-3">Scope</th><th className="p-3">Claims</th><th className="p-3">What the student sees</th><th className="p-3">Review</th></tr></thead>
                <tbody>
                  {Object.entries(SCOPES).map(([s, info]) => (
                    <tr key={s} className="border-t border-border/40">
                      <td className="p-3 font-mono font-semibold">{s}</td>
                      <td className="p-3 font-mono text-xs">{info.claims.join(", ") || "refresh_token"}</td>
                      <td className="p-3 text-muted-foreground">{info.consent}</td>
                      <td className="p-3">{info.needsReview ? "Required" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="endpoints" className="mt-16">
            <h2 id="endpoints" className="text-2xl font-bold">Endpoints</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[220px_1fr]">
              {[["Discovery", `${ISSUER}/.well-known/openid-configuration`], ["Authorization", ENDPOINTS.authorization], ["Token", ENDPOINTS.token], ["UserInfo", ENDPOINTS.userinfo], ["JWKS", ENDPOINTS.jwks], ["Revocation", ENDPOINTS.revocation], ["JS SDK", `${ISSUER}/sdk/v1/campusloop.js`]].map(([k, v]) => (
                <div key={k} className="contents"><dt className="font-semibold">{k}</dt><dd className="break-all font-mono text-xs text-muted-foreground sm:text-sm">{v}</dd></div>
              ))}
            </dl>
            <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground">
              <li>Flow: Authorization Code with PKCE (S256). PKCE is required for browser and mobile apps and recommended for all.</li>
              <li>Tokens: ES256 JWTs. Access tokens last 1 hour; refresh tokens (scope <code className="font-mono">offline_access</code>) last 30 days and rotate on every use. Reusing an old refresh token revokes the session.</li>
              <li>Redirect URIs match exactly. Use https, http://localhost for development, or an app scheme like com.example.app:/callback.</li>
              <li>The redirect includes <code className="font-mono">iss</code> (RFC 9207); check it if your library supports it.</li>
            </ul>
          </section>

          <section aria-labelledby="rules" className="mt-16">
            <h2 id="rules" className="text-2xl font-bold">Brand and usage rules</h2>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>Use the official buttons or the SDK button. Don't change the logo or colours, and keep the text "Continue with CampusLoop" or "Sign in with CampusLoop".</li>
              <li>Don't name your app "CampusLoop" or imply CampusLoop runs it.</li>
              <li>Ask only for scopes you need, explain why in your privacy policy, and never sell student data.</li>
              <li>Apps that misuse student data are suspended, which signs every student out of them.</li>
            </ul>
          </section>

          <section aria-labelledby="faq" className="mt-16">
            <h2 id="faq" className="text-2xl font-bold">FAQ</h2>
            <div className="mt-4 divide-y divide-border/50 border-y border-border/50">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold">{q}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </main>
        <CTABand
          title="Give students one-tap sign-in."
          lede="Register an app and have Login with CampusLoop working in minutes."
          primaryHref="/developer/apps/new"
          primaryLabel="Register your app"
          secondaryHref="/guide/login-with-campusloop"
          secondaryLabel="How it works for students"
        />
        <MarketingFooter />
      </div>
    </>
  );
}

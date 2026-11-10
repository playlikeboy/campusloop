import { ArrowRight, Bot, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocsJoinBand } from "@/components/docs/docs-join-band";
import { AgentPromptButtons } from "@/components/oauth/agent-prompt-buttons";
import { DevelopersReference } from "@/components/oauth/developers-reference";
import { Quickstart } from "@/components/oauth/quickstart";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { Button } from "@/components/ui/button";
import { ISSUER } from "@/lib/oauth/config";
import { RECIPES, SKILL_URL } from "@/lib/oauth/skill";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Login with CampusLoop for developers",
    description:
      "Add a Login with CampusLoop button and know if a user is a verified college student. OpenID Connect with PKCE, framework guides and an AI agent skill file.",
    path: "/developers",
    keywords: [
      "login with campusloop",
      "student verification API",
      "verified student login India",
      "OpenID Connect provider",
      "OAuth 2.0 PKCE",
      "college email verification API",
    ],
  }),
  alternates: { canonical: absoluteUrl("/developers"), types: { "text/markdown": "/developers/SKILL.md" } },
};

const WHY = [
  {
    title: "Know who's a real student",
    body: "Every token says whether the person signed up with a verified college email. Gate student discounts, hackathons or campus-only features without collecting ID cards.",
  },
  {
    title: "One tap for students",
    body: "Students already have CampusLoop. No new password, no form, and after the first time no consent screen either.",
  },
  {
    title: "Private by default",
    body: "Apps get a per-app anonymous ID and only the scopes the student approves. Phone, birthday, gender, location and anonymous identities are never shared.",
  },
  {
    title: "Standard and secure",
    body: "OpenID Connect with Authorization Code + PKCE, ES256-signed tokens and rotating refresh tokens. Any OIDC library works.",
  },
];

const FAQ = [
  ["Is it free?", "Yes. Registering apps and signing students in is free."],
  [
    "Which libraries work?",
    "Anything that speaks OpenID Connect: Auth.js / NextAuth, Clerk and Supabase custom OIDC providers, Firebase OIDC, Passport, openid-client, Spring Security, Django allauth and more. Use the issuer URL and they discover everything.",
  ],
  [
    "How do I know someone is a verified student?",
    "Request the student scope and read the student_verified claim from the id_token or /oauth/userinfo. It is true only for accounts verified with a college email.",
  ],
  [
    "Can I get the student's college or email?",
    "Yes, instantly. Ask for the email, college and academic scopes; the student approves them once on the consent screen.",
  ],
  [
    "Can an AI agent set this up for me?",
    "Yes. Open your app in the developer portal and use Copy prompt, or point your agent at https://campusloop.space/developers/SKILL.md. It adds the keys to .env, wires up your framework and pushes the code.",
  ],
  [
    "Which redirect URI do I register?",
    "Each recipe lists its callback path, for example /api/auth/oauth2/callback/campusloop for Better Auth or /api/auth/callback/campusloop for Auth.js. Register it for every domain, plus http://localhost for development.",
  ],
  [
    "Why is sub different from the student's CampusLoop ID?",
    "Each app gets its own stable, anonymous subject so apps can't track students across sites. Store sub as the user key.",
  ],
  [
    "What if a student removes my app?",
    "Their refresh tokens stop working and /oauth/userinfo returns invalid_token. Treat that as signed out.",
  ],
] as const;

const code = "rounded-sm bg-surface-muted px-1.5 py-0.5 font-mono text-[0.9em] text-fg";

export default function DevelopersPage() {
  const techArticle = {
    "@type": "TechArticle",
    headline: "Login with CampusLoop: developer documentation",
    url: absoluteUrl("/developers"),
    about: "OpenID Connect provider for verified college students in India",
    publisher: { "@id": `${SITE_URL}/#organization` },
    hasPart: [
      {
        "@type": "WebPage",
        name: "Login with CampusLoop agent skill (SKILL.md)",
        url: SKILL_URL,
        encodingFormat: "text/markdown",
      },
      {
        "@type": "WebAPI",
        name: "CampusLoop OpenID Connect provider",
        documentation: absoluteUrl("/developers"),
        url: `${ISSUER}/.well-known/openid-configuration`,
      },
    ],
  };
  const faqJsonLd = {
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <JsonLd
        data={[breadcrumbJsonLd([{ name: "Developers", path: "/developers" }]), techArticle, faqJsonLd]}
      />
      <MarketingShell>
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
          <header className="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <h1 className="text-4xl text-fg sm:text-5xl">Login with CampusLoop</h1>
              <p className="mt-4 max-w-xl text-lg text-fg-muted">
                Add one button and know if your users are verified college students. It's OpenID Connect, so
                it works with the auth library you already use.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/developer/apps/new">
                    Register your app
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <a href="#quickstart">Quickstart</a>
                </Button>
              </div>
            </div>
            <figure className="rounded-lg border border-border bg-surface p-6">
              <div className="space-y-3">
                <img
                  src="/oauth/button-light.svg"
                  alt="Continue with CampusLoop button, light"
                  width={280}
                  height={48}
                />
                <img
                  src="/oauth/button-dark.svg"
                  alt="Continue with CampusLoop button, dark"
                  width={280}
                  height={48}
                />
              </div>
              <figcaption className="mt-4 text-sm text-fg-muted">
                Official buttons. Download{" "}
                <a
                  className="text-brand-text underline underline-offset-2"
                  href="/oauth/button-light.svg"
                  download
                >
                  light
                </a>
                ,{" "}
                <a
                  className="text-brand-text underline underline-offset-2"
                  href="/oauth/button-dark.svg"
                  download
                >
                  dark
                </a>{" "}
                or{" "}
                <a className="text-brand-text underline underline-offset-2" href="/oauth/icon.svg" download>
                  icon
                </a>
                .
              </figcaption>
            </figure>
          </header>

          <section aria-labelledby="why" className="mt-16">
            <h2 id="why" className="text-2xl text-fg sm:text-3xl">
              Why add it
            </h2>
            <ul className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {WHY.map(({ title, body }) => (
                <li key={title} className="flex gap-3">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-fg-subtle" />
                  <span>
                    <span className="block font-semibold text-fg">{title}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="agents"
            id="ai-agents"
            className="mt-16 scroll-mt-24 rounded-lg border border-border bg-surface p-6"
          >
            <h2 id="agents" className="flex items-center gap-2 text-2xl text-fg">
              <Bot aria-hidden className="size-6 text-fg-muted" />
              Set it up with an AI agent
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              Give your coding agent (Claude Code, Cursor, Codex, Windsurf) the skill file. It finds your
              stack, adds the keys to <code className={code}>.env</code>, wires up sign-in, and commits the
              code. For a prompt with your client ID and redirect URIs filled in, open your app in the{" "}
              <Link href="/developer" className="font-semibold text-brand-text hover:underline">
                developer portal
              </Link>
              .
            </p>
            <p className="mt-3 break-all font-mono text-sm">
              <a href="/developers/SKILL.md" className="font-semibold text-brand-text hover:underline">
                {SKILL_URL}
              </a>
            </p>
            <div className="mt-4">
              <AgentPromptButtons keys={{}} compact />
            </div>
          </section>

          <section aria-labelledby="quickstart-title" id="quickstart" className="mt-16 scroll-mt-24">
            <h2 id="quickstart-title" className="text-2xl text-fg sm:text-3xl">
              Quickstart
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-fg-muted">
              <li>
                <strong className="text-fg">Register.</strong> Open{" "}
                <Link href="/developer/apps/new" className="font-semibold text-brand-text hover:underline">
                  /developer/apps/new
                </Link>
                , pick web app (server) or browser/mobile app, and add your redirect URIs.
              </li>
              <li>
                <strong className="text-fg">Configure.</strong> Point your OIDC library at the issuer{" "}
                <code className={code}>{ISSUER}</code> with your client ID (and secret).
              </li>
              <li>
                <strong className="text-fg">Read the claims.</strong> Use <code className={code}>sub</code> as
                the user ID and <code className={code}>student_verified</code> to turn on student-only
                features.
              </li>
            </ol>
            <nav aria-label="Frameworks" className="mt-6 flex flex-wrap gap-2">
              {RECIPES.map((r) => (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className="inline-flex h-9 items-center rounded-full bg-surface-muted px-3.5 text-sm font-medium text-fg transition-ui hover:bg-surface-sunken"
                >
                  {r.title.split(" (")[0]}
                </a>
              ))}
            </nav>
            <div className="mt-4">
              <Quickstart />
            </div>
          </section>

          <DevelopersReference />

          <section aria-labelledby="faq" className="mt-16">
            <h2 id="faq" className="text-2xl text-fg sm:text-3xl">
              Questions
            </h2>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center py-3 font-semibold text-fg group-open:text-brand-text">
                    {q}
                  </summary>
                  <p className="pb-4 text-sm text-fg-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <DocsJoinBand
          signedIn={false}
          title="Give students one-tap sign-in"
          body="Register an app and have Login with CampusLoop working in a few minutes."
          href="/developer/apps/new"
          label="Register your app"
        />
      </MarketingShell>
    </>
  );
}

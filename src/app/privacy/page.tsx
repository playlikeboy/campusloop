import {
  DocLayout,
  DocList,
  DocNote,
  DocSection,
  type DocSectionRef,
  DocSummary,
  DocTable,
  LegalDocHeader,
  MailLink,
} from "@/components/marketing/legal-doc";
import { MarketingShell } from "@/components/shells/marketing-shell";
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/lib/seo/json-ld-script";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "What CampusLoop collects, which services we use, how anonymous posts and emails work, and your rights under India's DPDP Act, 2023.",
  path: "/privacy",
});

const SECTIONS: DocSectionRef[] = [
  { id: "collect", label: "What we collect" },
  { id: "anonymity", label: "Anonymous posts" },
  { id: "services", label: "Services we use" },
  { id: "analytics", label: "Analytics" },
  { id: "emails", label: "Emails" },
  { id: "apps", label: "Connected apps" },
  { id: "sharing", label: "What we never do" },
  { id: "rights", label: "Your rights" },
  { id: "security", label: "How data is stored" },
  { id: "officer", label: "Grievance Officer" },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <JsonLd
        data={[
          {
            "@type": "WebPage",
            name: "CampusLoop Privacy Policy",
            url: `${SITE_URL}/privacy`,
            inLanguage: "en-IN",
            dateModified: "2026-11-26",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          breadcrumbJsonLd([{ name: "Privacy Policy", path: "/privacy" }]),
        ]}
      />
      <DocLayout
        sections={SECTIONS}
        header={
          <LegalDocHeader
            title="Privacy policy"
            summary="What we keep, how anonymous posts work, and how you stay in control of your data."
            meta={["Updated 26 November 2026", "Built to follow India's DPDP Act, 2023"]}
          />
        }
      >
        <DocSummary
          items={[
            "Your email is used to sign you in and, if it's a college email, to verify you. It is never shown or sold.",
            "Anonymous posts and Secret Crush never show your name to other users.",
            "We use Google Analytics to see how the app is used. There is no ad tracking and we don't sell data.",
            "Product emails always have an unsubscribe link.",
            "You can ask for a copy of your data, fix it or delete it any time.",
          ]}
        />

        <DocSection id="collect" title="What we collect">
          <DocTable
            rows={[
              {
                label: "Your email",
                value: "To sign you in and send account emails",
                note: "Any email works. If it's a college email, we also use it to verify you. Never shown on your profile, never sold or rented.",
              },
              {
                label: "GitHub details",
                value: "Only if you verify with GitHub",
                note: "We keep your GitHub user id and username. We ask GitHub only for basic profile access, check your student status, then cancel our access. One GitHub account can verify one profile.",
              },
              {
                label: "Profile details",
                value: "Name, photo, college, branch, year, bio, interests",
                note: "Only what you choose to add. You can edit them any time, and most are optional.",
              },
              {
                label: "What you post",
                value: "Posts, comments, polls, notes, stories, chats",
                note: "Stored in our database so people on CampusLoop can see it. Posts in a private community are shown only to its members.",
              },
              {
                label: "Play",
                value: "Votes, scores, badges, Loop Points",
                note: "If you enter DP Battle, your current profile photo is shown to students at your college to vote on. You can leave any time.",
              },
              {
                label: "Device and security data",
                value: "Session tokens, basic device details, push tokens",
                note: "Used to keep you signed in, send notifications you allow, and catch account takeovers and spam. Never shared with advertisers.",
              },
            ]}
          />
        </DocSection>

        <DocSection id="anonymity" title="Anonymous posts">
          <p>
            Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates,
            seniors, faculty and college staff. Your identity is encrypted separately. CampusLoop can only
            recover it for a lawful order or a serious safety report, and every such access is logged.
          </p>
          <DocList
            items={[
              "Anonymous posts and confessions show a made-up name, not your profile.",
              "When you comment anonymously or send a Secret Crush, the notification says \"Someone\", not your name.",
              "Before you post, we warn you if the text has a phone number, roll number or email that could identify you.",
              "Only a CampusLoop admin can look up who wrote an anonymous post, and only for the reasons above.",
            ]}
          />
          <DocNote>
            Anonymity protects you from classmates, not from Indian law. It never covers threats, extortion,
            bullying or content involving minors.
          </DocNote>
        </DocSection>

        <DocSection id="services" title="Services we use">
          <p>We use a few outside services to run CampusLoop. Each gets only what it needs for its job.</p>
          <DocTable
            rows={[
              { label: "Neon", value: "Database", note: "Stores accounts, posts and chats." },
              {
                label: "Cloudflare",
                value: "Hosting, file storage and email sending",
                note: "Runs the website, stores uploaded files and sends our emails.",
              },
              { label: "Hexclave", value: "Sign-in", note: "Handles sign-in, including Sign in with Google." },
              { label: "Upstash", value: "Rate limits and caching", note: "Helps stop spam and keeps pages fast." },
              { label: "Google Analytics 4", value: "Usage statistics", note: "See Analytics below." },
              {
                label: "Web Push and Expo",
                value: "Notifications",
                note: "Delivers notifications to your browser or Android app, only if you allow them.",
              },
              { label: "GitHub", value: "Student verification", note: "Only if you choose to verify with GitHub." },
              { label: "ImgBB", value: "Image hosting", note: "Stores some uploaded images." },
              {
                label: "Giphy and Unsplash",
                value: "GIF and photo search",
                note: "Receive what you type in the GIF or photo search. Not your name or email.",
              },
            ]}
          />
        </DocSection>

        <DocSection id="analytics" title="Analytics">
          <p>
            We use Google Analytics 4 to see which pages and features people use, so we know what to fix.
            It loads for everyone. There is no separate consent pop-up yet.
          </p>
          <DocList
            items={[
              "When you are signed in, we send your internal CampusLoop account id, not your name or email, so visits from one person count once.",
              "We also send general details like your device type, whether you use the app or the website, and your expected graduation year.",
              "We don't send what you post or your messages.",
              "We don't use it for ads, and we never sell your data.",
            ]}
          />
        </DocSection>

        <DocSection id="emails" title="Emails">
          <p>
            We send account emails, like sign-in and verification links and security notices. You can&apos;t
            turn these off while you have an account.
          </p>
          <p>
            We also send some product emails to groups of users, like a welcome note, verification reminders,
            feature news, event digests and news about our Android app. Every one has a one-click unsubscribe
            link. Unsubscribing stops product emails only, not account or security emails.
          </p>
        </DocSection>

        <DocSection id="apps" title="Connected apps">
          <p>
            If you connect an outside app to your CampusLoop account, it gets only the access shown on the
            approval screen. That app&apos;s developer, not CampusLoop, handles what it does with that data.
            You can remove an app any time in Settings, under Connected apps.
          </p>
        </DocSection>

        <DocSection id="sharing" title="What we never do">
          <DocList
            items={[
              "Sell, rent or trade your personal data or browsing history.",
              "Show your email to recruiters, advertisers or other students.",
              "Show ads based on your activity.",
              "Read your private messages for ads or profiling.",
            ]}
          />
        </DocSection>

        <DocSection id="rights" title="Your rights">
          <p>Under the Digital Personal Data Protection Act, 2023, you can:</p>
          <DocList
            items={[
              <>
                <strong className="font-semibold text-fg">Get a copy of your data</strong> by emailing{" "}
                <MailLink email="privacy@campusloop.space" />.
              </>,
              <>
                <strong className="font-semibold text-fg">Correct it</strong> by editing your profile.
              </>,
              <>
                <strong className="font-semibold text-fg">Delete it:</strong> ask for your account and
                personal details to be deleted at <MailLink email="privacy@campusloop.space" />.
              </>,
              <>
                <strong className="font-semibold text-fg">Complain</strong> to our Grievance Officer if
                something goes wrong.
              </>,
            ]}
          />
        </DocSection>

        <DocSection id="security" title="How data is stored">
          <p>
            Data is encrypted in transit with TLS and stored on Neon PostgreSQL, with the website running on
            Cloudflare. The link between an anonymous post and its author is encrypted separately from the
            post, and the key is not kept in the database.
          </p>
        </DocSection>

        <DocSection id="officer" title="Data Protection and Grievance Officer">
          <p>
            Appointed under the DPDP Act, 2023 and Rule 3(2) of the Information Technology (Intermediary
            Guidelines and Digital Media Ethics Code) Rules, 2021.
          </p>
          <DocTable
            rows={[
              { label: "Grievance Officer", value: "Shaswat Raj" },
              { label: "Complaints", value: <MailLink email="grievance@campusloop.space" /> },
              { label: "Privacy requests", value: <MailLink email="privacy@campusloop.space" /> },
              { label: "We reply", value: "Within 24 to 48 working hours" },
              {
                label: "Legal entity",
                value: "CampusLoop (not yet incorporated), operated by founder Shaswat Raj",
              },
            ]}
          />
        </DocSection>
      </DocLayout>
    </MarketingShell>
  );
}

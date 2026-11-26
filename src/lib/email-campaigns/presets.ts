import type { CampaignContent } from "./render";
import type { SegmentSpec } from "./segment-spec";

/**
 * Ready-made campaign templates for Admin -> Emails. Simple, friendly copy for
 * Indian college students. Admins load one, edit it, and can save their own
 * version to the email_templates table. `suggestedSegment` pre-fills the
 * audience builder; the admin can change it before sending.
 */
export interface EmailPreset extends CampaignContent {
  key: string;
  name: string;
  description: string;
  suggestedSegment?: Partial<SegmentSpec>;
}

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    key: "finish-onboarding",
    name: "Welcome: finish setting up",
    description: "For students who signed up but never finished onboarding.",
    subject: "{{first_name}}, your CampusLoop profile is almost ready",
    preheader: "Two minutes and you are in your campus feed.",
    heading: "Hey {{first_name}}, welcome to CampusLoop",
    body: [
      "You signed up but did not finish setting up your profile. It takes about two minutes.",
      "Once you are in, you can:",
      "- See what is happening at {{college}} today\n- Join clubs, polls and confessions\n- Find notes, PYQs and people from your branch",
      "See you on the inside.",
    ].join("\n\n"),
    buttonLabel: "Finish my profile",
    buttonUrl: "/onboarding",
    suggestedSegment: { onboarding: "not_finished" },
  },
  {
    key: "verify-college",
    name: "Verify your college",
    description: "For students who joined with a personal email.",
    subject: "Get your verified tick on CampusLoop",
    preheader: "Use your college email or GitHub Student Pack. Takes a minute.",
    heading: "Show everyone you are really from {{college}}",
    body: [
      "Hi {{first_name}}, your account is not verified yet. Verified students get the blue tick, can post on the campus feed and show up first in search.",
      "You can verify in two ways:",
      "- Your **college email** (the one ending in .ac.in or .edu.in)\n- Your **GitHub Student Pack**, if your college has no email for students",
      "It only takes a minute.",
    ].join("\n\n"),
    buttonLabel: "Verify my account",
    buttonUrl: "/settings/verify",
    suggestedSegment: { verification: "unverified" },
  },
  {
    key: "come-back-7",
    name: "Come back (7 days)",
    description: "Gentle nudge for students away for a week.",
    subject: "{{first_name}}, here is what you missed this week",
    preheader: "New posts, polls and people from {{college}}.",
    heading: "Your campus kept talking",
    body: [
      "Hey {{first_name}}, it has been a week. People at {{college}} posted new polls, notes and confessions while you were away.",
      "Pop in for two minutes and catch up.",
    ].join("\n\n"),
    buttonLabel: "Open my feed",
    buttonUrl: "/feeds",
    suggestedSegment: { inactiveDays: 7 },
  },
  {
    key: "come-back-14",
    name: "Come back (14 days)",
    description: "For students away for two weeks.",
    subject: "We saved your spot, {{first_name}}",
    preheader: "Two weeks of campus news is waiting.",
    heading: "Long time, {{first_name}}",
    body: [
      "Two weeks is a long time on campus. There are new events, new notes and probably a few people from your branch you have not met yet.",
      "- Check the trending posts at {{college}}\n- Play today's trivia and climb your campus leaderboard\n- Say hi in a club",
    ].join("\n\n"),
    buttonLabel: "See what is new",
    buttonUrl: "/feeds",
    suggestedSegment: { inactiveDays: 14 },
  },
  {
    key: "come-back-30",
    name: "Come back (30 days)",
    description: "Win-back for students away for a month or more.",
    subject: "{{first_name}}, a lot changed on CampusLoop",
    preheader: "New games, an Android app and your campus is busier than ever.",
    heading: "A month away? Here is what is new",
    body: [
      "Hi {{first_name}}, a lot has happened since you last opened CampusLoop:",
      "- **Play**: DP Battle, Meme War, daily trivia and Branch Wars\n- **Android app**: faster, with notifications\n- More students from {{college}} joined",
      "Come take a look. If these emails are not for you, you can unsubscribe below.",
    ].join("\n\n"),
    buttonLabel: "Come back to CampusLoop",
    buttonUrl: "/feeds",
    suggestedSegment: { inactiveDays: 30 },
  },
  {
    key: "feature-play",
    name: "New feature: Play",
    description: "Announce DP Battle, Meme War, trivia, This or That and Branch Wars.",
    subject: "New on CampusLoop: Play with your campus",
    preheader: "DP Battle, Meme War, daily trivia and Branch Wars are live.",
    heading: "Play is here",
    body: [
      "Hey {{first_name}}, we just launched **Play**, a set of quick games for your campus:",
      "- **DP Battle**: vote for the best profile picture of the week\n- **Meme War**: post memes and vote for the funniest\n- **Daily trivia**: 10 questions, one try a day\n- **This or That** and **Branch Wars**: settle the big campus debates",
      "Every game has a leaderboard for {{college}}. Can your branch win this week?",
    ].join("\n\n"),
    buttonLabel: "Start playing",
    buttonUrl: "/play",
  },
  {
    key: "event-digest",
    name: "Event digest",
    description: "A short list of upcoming events. Edit the list before sending.",
    subject: "Happening this week at {{college}}",
    preheader: "Fests, workshops and meetups you should not miss.",
    heading: "This week on campus",
    body: [
      "Hi {{first_name}}, here is what is coming up:",
      "- **Event name**: day, time, place\n- **Event name**: day, time, place\n- **Event name**: day, time, place",
      "Tap below to see all events and RSVP.",
    ].join("\n\n"),
    buttonLabel: "See all events",
    buttonUrl: "/events",
  },
  {
    key: "android-app",
    name: "Android app is out",
    description: "Announce the Android app.",
    subject: "CampusLoop is now on Android",
    preheader: "Faster feed, instant notifications, works on low data.",
    heading: "CampusLoop, now in your pocket",
    body: [
      "Hey {{first_name}}, our Android app is ready.",
      "- Instant notifications for replies, matches and messages\n- A faster feed that works well on mobile data\n- Same account, nothing to set up again",
    ].join("\n\n"),
    buttonLabel: "Download the app",
    buttonUrl: "/download",
    suggestedSegment: { androidApp: "without" },
  },
  {
    key: "custom",
    name: "Blank (custom)",
    description: "Start from scratch.",
    subject: "",
    preheader: "",
    heading: "",
    body: "Hi {{first_name}},\n\n",
    buttonLabel: "",
    buttonUrl: "",
  },
];

export function getPreset(key: string): EmailPreset | undefined {
  return EMAIL_PRESETS.find((p) => p.key === key);
}

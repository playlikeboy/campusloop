/** Copy for /pitch. Plain words, no invented numbers: live counts come from getPublicStats(). */

export const PITCH_DECK_PDF_URL = process.env.NEXT_PUBLIC_PITCH_DECK_PDF_URL || "/pitch.pdf";
export const SLIDES_URL = "https://canva.link/zdg5k3nnw9ifaaa";

export const PROBLEMS = [
  {
    title: "Spread everywhere",
    body: "Campus life is split across WhatsApp groups, unofficial Instagram pages, dead Discord servers and unmoderated confession accounts.",
  },
  {
    title: "Anyone can get in",
    body: "Recruiters, bots and fake profiles join every open channel, so students hold back.",
  },
  {
    title: "Anonymity without safety",
    body: "Confession pages run on DMs to an unknown admin. Nobody can act on harassment or doxxing.",
  },
];

export const PRODUCT_LAYERS = [
  {
    title: "Verified entry",
    body: "Sign up with a college email. Other emails get Campus Preview without the verified tick.",
  },
  {
    title: "Campus feed and confessions",
    body: "Posts, polls and anonymous confessions, with a sealed and logged identity link.",
  },
  { title: "Campus Match and Secret Crush", body: "Every profile is a verified student aged 18 or older." },
  {
    title: "Campus services",
    body: "Buy and sell, lost and found, housing, rideshare, events and a campus marketplace.",
  },
  {
    title: "Loop Points",
    body: "Points for posting, inviting and helping, so students bring their friends.",
  },
];

export const REVENUE = [
  { title: "Brand campaigns", body: "Brands reach verified 18 to 24 year olds, campus by campus." },
  { title: "Event ticketing", body: "A cut of fest, workshop and club passes." },
  {
    title: "Campus commerce",
    body: "Commission and delivery fees on marketplace orders, plus merchant plans.",
  },
  { title: "Hiring", body: "Startups find real students by college, branch and skill." },
];

export const ROADMAP = [
  {
    when: "Now",
    title: "Live at BIT Mesra",
    body: "Feed, confessions, polls, stories, Campus Match, chat, communities, study material, marketplace, moderation and Campus Preview are live at campusloop.space.",
  },
  {
    when: "Next two quarters",
    title: "25 engineering colleges",
    body: "Launches led by student ambassadors, aiming for deep use on each campus, then growing through referrals.",
  },
  {
    when: "12 to 18 months",
    title: "Start earning",
    body: "Brand campaigns and ticketing on busy campuses first. Marketplace fees follow once orders pick up.",
  },
];

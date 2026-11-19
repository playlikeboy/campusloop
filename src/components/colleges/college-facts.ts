/** Plain facts and FAQ text for a college page. Shared by the page UI and its JSON-LD. */

export interface CollegeFactsInput {
  name: string;
  district?: string | null;
  state?: string | null;
  yearOfEstablishment?: number | null;
  nirfRank?: number | null;
  aisheCode?: string | null;
  locationType?: string | null;
  websiteHost?: string | null;
  emailDomains: string[];
  studentCount: number;
  postCount: number;
  noteCount: number;
}

export function collegeShortName(name: string): string {
  return name.split(",")[0].trim();
}

export function collegeFacts(c: CollegeFactsInput): { label: string; value: string }[] {
  const place = [c.district, c.state].filter(Boolean).join(", ");
  const aishe = c.aisheCode && !c.aisheCode.startsWith("SYSTEM") ? c.aisheCode : null;
  return [
    place ? { label: "Location", value: place } : null,
    c.yearOfEstablishment ? { label: "Established", value: String(c.yearOfEstablishment) } : null,
    c.nirfRank ? { label: "NIRF rank", value: `#${c.nirfRank}` } : null,
    c.locationType ? { label: "Campus type", value: c.locationType } : null,
    aishe ? { label: "AISHE code", value: aishe } : null,
    c.websiteHost ? { label: "Website", value: c.websiteHost } : null,
    c.emailDomains.length
      ? { label: "Student email", value: c.emailDomains.slice(0, 3).map((d) => `@${d}`).join(", ") }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);
}

export function collegeFaqs(c: CollegeFactsInput): { q: string; a: string }[] {
  const short = collegeShortName(c.name);
  const domain = c.emailDomains[0];
  const faqs = [
    {
      q: `How do I join the ${short} community on CampusLoop?`,
      a: domain
        ? `Sign up with your ${short} email address ending in @${domain}. Once you confirm the email, you can post, vote in polls, comment and chat with other ${short} students. Joining is free.`
        : `Sign up with your ${short} college email address. Once you confirm the email, you can post, vote in polls, comment and chat with other ${short} students. Joining is free.`,
    },
    {
      q: `Who can see posts from ${short}?`,
      a: `Anyone can read public posts. Only students who verified a ${short} college email can post, vote and comment here. Anonymous posts never show the author's name.`,
    },
    {
      q: `Are there notes and previous year papers for ${short}?`,
      a:
        c.noteCount > 0
          ? `Yes. Students have shared ${c.noteCount} notes and past papers for ${short}. They are free to open and sorted by branch and semester.`
          : `Not yet. Any ${short} student can upload notes and past papers, and they stay free for everyone at the college.`,
    },
    {
      q: `I am not a ${short} student yet. Can I look around?`,
      a: `Yes. Sign up with a personal email to browse in Campus Preview. You can read posts and study material, and unlock posting when you get your college email.`,
    },
  ];
  return faqs;
}

/** One-paragraph summary used when a college has no written description. */
export function collegeSummary(c: CollegeFactsInput): string {
  const place = [c.district, c.state].filter(Boolean).join(", ");
  const parts = [`${c.name} is a college${place ? ` in ${place}` : " in India"}`];
  if (c.yearOfEstablishment) parts.push(`established in ${c.yearOfEstablishment}`);
  let text = `${parts.join(", ")}.`;
  if (c.nirfRank) text += ` It is ranked #${c.nirfRank} in NIRF.`;
  text +=
    c.studentCount > 0
      ? ` ${c.studentCount} of its students are on CampusLoop, where they share posts, polls, notes and events.`
      : ` Its students can join CampusLoop with a college email to share posts, polls, notes and events.`;
  return text;
}

/**
 * A college page is offered to search engines only when it has something of its
 * own: a written description, students, posts, study material or a national
 * rank. The other pages stay
 * reachable and followable, but are not indexed and are left out of the sitemap.
 */
export const COLLEGE_INDEX_RULE = { minStudents: 5, minPosts: 3, minNotes: 3, minDescription: 200 } as const;

export function isCollegeIndexable(c: {
  studentCount: number;
  postCount: number;
  noteCount: number;
  nirfRank?: number | null;
  description?: string | null;
}): boolean {
  return (
    Boolean(c.nirfRank) ||
    (c.description?.trim().length ?? 0) >= COLLEGE_INDEX_RULE.minDescription ||
    c.studentCount >= COLLEGE_INDEX_RULE.minStudents ||
    c.postCount >= COLLEGE_INDEX_RULE.minPosts ||
    c.noteCount >= COLLEGE_INDEX_RULE.minNotes
  );
}

const cap = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/** Search title: short name plus what the page offers, kept inside the visible width. */
export function collegeMetaTitle(c: Pick<CollegeFactsInput, "name" | "district" | "state">): string {
  const short = collegeShortName(c.name);
  const place = c.district || c.state;
  const full = `${short}${place ? ` (${place})` : ""}: notes, PYQs and students`;
  if (full.length <= 58) return full;
  const noPlace = `${short}: notes, PYQs and students`;
  return noPlace.length <= 58 ? noPlace : cap(c.name, 58);
}

/** Search description built from real numbers; never claims content the page does not have. */
export function collegeMetaDescription(c: CollegeFactsInput): string {
  const place = [c.district, c.state].filter(Boolean).join(", ");
  const lead = `${c.name}${place ? ` in ${place}` : ""}${c.yearOfEstablishment ? `, est. ${c.yearOfEstablishment}` : ""}.`;
  const has = [
    c.noteCount > 0 ? `${c.noteCount} free notes and PYQs` : null,
    c.postCount > 0 ? `${c.postCount} student posts` : null,
    c.nirfRank ? `NIRF #${c.nirfRank}` : null,
  ].filter(Boolean);
  const middle = has.length ? ` ${has.join(", ")}.` : " Student posts, notes and PYQs.";
  const domain = c.emailDomains[0];
  return cap(`${lead}${middle} Join with your ${domain ? `@${domain}` : "college"} email.`, 155);
}

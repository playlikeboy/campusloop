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

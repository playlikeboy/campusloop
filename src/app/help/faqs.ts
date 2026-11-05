export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const CATEGORIES = [
  "All questions",
  "Verification and access",
  "Academics and Vault",
  "Safety and anonymity",
  "Communities and clubs",
];

/** Shared by the help page (FAQ JSON-LD) and the client accordion, so both say the same thing. */
export const FAQS: FAQItem[] = [
  {
    id: "verify-1",
    category: "Verification and access",
    question: "How do I get verified on my campus hub?",
    answer:
      "Sign up with your college email (for example name@college.ac.in). A verification code confirms the address and gives you the verified tick on your campus timeline.",
  },
  {
    id: "verify-2",
    category: "Verification and access",
    question: "What if my college domain is not listed yet?",
    answer:
      "Request your college from the directory with its name and official email domain. The team reviews requests, usually within a day. Until then you can use Campus Preview with any email.",
  },
  {
    id: "academics-1",
    category: "Academics and Vault",
    question: "How does the Academic Vault work?",
    answer:
      "The Academic Vault holds student-uploaded notes, lab manuals, cheat sheets and previous year question papers organised by branch, subject code and semester. Browsing is open; reading and downloading private files needs a CampusLoop account.",
  },
  {
    id: "academics-2",
    category: "Academics and Vault",
    question: "Can I upload notes or past papers?",
    answer:
      "Yes. Verified students can upload study material to their college or branch vault. Helpful uploads earn Loop Points.",
  },
  {
    id: "safety-1",
    category: "Safety and anonymity",
    question: "Is anonymous posting really private from classmates?",
    answer:
      "Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately and can only be recovered by CampusLoop in response to a lawful order or a serious safety report, and every such access is logged.",
  },
  {
    id: "safety-2",
    category: "Safety and anonymity",
    question: "How do I report harassment or ragging?",
    answer:
      "Every post, comment and confession has a Report option in its menu. Three independent reports hide the content from the campus feed until a moderator reviews it. For urgent concerns, email safety@campusloop.space.",
  },
  {
    id: "communities-1",
    category: "Communities and clubs",
    question: "How do student clubs and societies create hubs?",
    answer:
      "Verified students can create communities for interest groups, technical chapters or fests, and use them for announcements, event registrations and discussion threads.",
  },
  {
    id: "communities-2",
    category: "Communities and clubs",
    question: "Can I explore posts from other colleges in India?",
    answer:
      "Yes. Switch from your campus timeline to Global to see trending posts, fests, hackathons and placement threads from colleges across India.",
  },
];

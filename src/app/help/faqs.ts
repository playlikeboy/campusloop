export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const ALL_CATEGORY = "All";

export const CATEGORIES = [ALL_CATEGORY, "Joining", "Study material", "Safety", "Clubs and feed", "Account"];

/** Shared by the help page (FAQ JSON-LD) and the client list, so both say the same thing. */
export const FAQS: FAQItem[] = [
  {
    id: "verify-1",
    category: "Joining",
    question: "How do I get verified?",
    answer:
      "Sign up with your college email, for example name@college.ac.in. We send a code to that address. Enter it and you get the verified tick.",
  },
  {
    id: "verify-2",
    category: "Joining",
    question: "My college isn't listed. What now?",
    answer:
      "Send us your college name and its email domain from the Request your college page. We usually add it within a day. Until then, sign up with any email and use Campus Preview.",
  },
  {
    id: "academics-1",
    category: "Study material",
    question: "Where do I find notes and past papers?",
    answer:
      "Open Study material. Pick your branch, subject and semester to see notes, lab manuals, cheat sheets and previous year papers uploaded by students. Anyone can browse; you need an account to open private files.",
  },
  {
    id: "academics-2",
    category: "Study material",
    question: "Can I upload my notes?",
    answer: "Yes. Verified students can upload to their college or branch. Useful uploads earn Loop Points.",
  },
  {
    id: "safety-1",
    category: "Safety",
    question: "Can classmates see who posted anonymously?",
    answer:
      "No. Anonymous posts never show your name or profile to anyone on CampusLoop, including classmates, seniors, faculty and college staff. Your identity is encrypted separately. CampusLoop can only recover it for a lawful order or a serious safety report, and every such access is logged.",
  },
  {
    id: "safety-2",
    category: "Safety",
    question: "How do I report harassment or ragging?",
    answer:
      "Tap the menu on the post, comment or confession and choose Report. Three reports hide it until a moderator checks it. For anything urgent, email safety@campusloop.space or call 1800-180-5522.",
  },
  {
    id: "communities-1",
    category: "Clubs and feed",
    question: "How do I start a club or community?",
    answer:
      "Verified students can create a community from the Communities page. Use it for announcements, event sign-ups and discussions.",
  },
  {
    id: "communities-2",
    category: "Clubs and feed",
    question: "Can I see posts from other colleges?",
    answer:
      "Yes. On your feed, switch from your campus to Global to see popular posts, fests and hackathons from colleges across India.",
  },
  {
    id: "account-1",
    category: "Account",
    question: "Is CampusLoop free?",
    answer:
      "Yes. Joining and using CampusLoop is free. Things you buy, like marketplace orders, are paid separately.",
  },
  {
    id: "account-2",
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "Email privacy@campusloop.space from the address you signed up with and ask us to delete your account. We delete your account and personal details.",
  },
];

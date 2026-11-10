export interface HashtagTheme {
  tag: string;
  displayName: string;
  category: string;
  iconName: "UtensilsCrossed" | "Code2" | "Briefcase" | "BookOpen" | "Flame" | "Heart" | "Hash";
  gradient: string;
  accentColor: string;
  tagline: string;
  description: string;
  prompts: string[];
  relatedTags: string[];
}

export function getHashtagTheme(rawTag: string): HashtagTheme {
  const clean = rawTag.toLowerCase().replace(/^#/, "").trim();

  // 1. Food & Canteen Topics
  if (
    clean === "campusfood" ||
    clean === "food" ||
    clean === "messfood" ||
    clean === "canteen" ||
    clean === "midnightcravings" ||
    clean === "maggi" ||
    clean === "chai" ||
    clean === "hostelfood" ||
    clean === "foodie"
  ) {
    return {
      tag: clean,
      displayName: `#${clean}`,
      category: "Food & Canteens",
      iconName: "UtensilsCrossed",
      gradient: "from-warning-subtle to-transparent",
      accentColor: "text-warning",
      tagline: "Mess food, canteen picks and late-night food spots.",
      description: "Students rate the mess, share canteen picks and recommend places to eat near campus.",
      prompts: [
        "Rate today's mess menu (out of 10)...",
        "Best item at your campus canteen under ₹50?",
        "Drop your favorite 2 AM midnight food spot...",
      ],
      relatedTags: ["#messfood", "#canteen", "#midnightcravings", "#hostellife", "#chai", "#maggi"],
    };
  }

  // 2. Coding & Tech
  if (
    clean === "tech" ||
    clean === "coding" ||
    clean === "leetcode" ||
    clean === "hackathon" ||
    clean === "webdev" ||
    clean === "ai" ||
    clean === "rust" ||
    clean === "opensource"
  ) {
    return {
      tag: clean,
      displayName: `#${clean}`,
      category: "Tech & Open Source",
      iconName: "Code2",
      gradient: "from-success-subtle to-transparent",
      accentColor: "text-success",
      tagline: "DSA questions, side projects and hackathon teams.",
      description:
        "Students share what they are building, ask coding questions, find hackathon teammates and talk about open source.",
      prompts: [
        "What are you building this weekend?",
        "Share your solution for today's daily problem...",
        "Looking for a hackathon teammate?",
      ],
      relatedTags: ["#LeetCode", "#Hackathon", "#BuildInPublic", "#NextJS", "#AI", "#Rust"],
    };
  }

  // 3. Placements & Careers
  if (
    clean === "placement" ||
    clean === "placements" ||
    clean === "placementseason" ||
    clean === "internship" ||
    clean === "careers" ||
    clean === "interview"
  ) {
    return {
      tag: clean,
      displayName: `#${clean}`,
      category: "Careers & Placements",
      iconName: "Briefcase",
      gradient: "from-brand-subtle to-transparent",
      accentColor: "text-brand-text",
      tagline: "Interview experiences, OA tips and company reviews.",
      description:
        "Seniors and classmates share online assessment (OA) rounds, group discussion tips, interview questions and placement advice.",
      prompts: [
        "Share your recent interview experience...",
        "Tips for clearing the Online Assessment round...",
        "Ask seniors about company work culture...",
      ],
      relatedTags: ["#PlacementSeason", "#Internship", "#ResumeTips", "#InterviewPrep", "#Referrals"],
    };
  }

  // 4. Exams & Academics
  if (
    clean === "exams" ||
    clean === "endsem" ||
    clean === "endsemsurvivors" ||
    clean === "midsem" ||
    clean === "pyqs" ||
    clean === "academics" ||
    clean === "notes"
  ) {
    return {
      tag: clean,
      displayName: `#${clean}`,
      category: "Exams & Academics",
      iconName: "BookOpen",
      gradient: "from-crush-subtle to-transparent",
      accentColor: "text-crush-text",
      tagline: "PYQs, notes and exam prep with classmates.",
      description:
        "Students share previous year questions (PYQs), notes, study material and tips for upcoming exams.",
      prompts: [
        "Need notes or PYQs for a tough subject?",
        "Drop professor hints for upcoming exams...",
        "All-nighter study playlist recommendations?",
      ],
      relatedTags: ["#EndsemSurvivors", "#PYQs", "#AllNighter", "#Syllabus", "#NotesHub"],
    };
  }

  // 5. Default General Campus Tag
  return {
    tag: clean,
    displayName: `#${clean}`,
    category: "Campus Discussions",
    iconName: "Hash",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    accentColor: "text-primary",
    tagline: `Posts from students tagged #${clean}.`,
    description: `Posts, questions and stories tagged #${clean} from students at colleges across India.`,
    prompts: [
      `What's happening on your campus with #${clean}?`,
      `Share your take on #${clean}...`,
      `Ask classmates about #${clean}...`,
    ],
    relatedTags: ["#HostelLife", "#CampusLife", "#Tech", "#CampusConfessions", "#EndsemSurvivors"],
  };
}

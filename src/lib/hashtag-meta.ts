export interface HashtagTheme {
  tag: string;
  displayName: string;
  category: string;
  iconName: "UtensilsCrossed" | "Code2" | "Briefcase" | "BookOpen" | "Flame" | "Sparkles" | "Heart" | "Hash";
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
      gradient: "from-amber-500/20 via-orange-500/15 to-transparent",
      accentColor: "text-amber-500",
      tagline: "Mess ratings, canteen specials, midnight Maggi & campus food spots.",
      description:
        "The pulse of campus hunger: real student mess reviews, canteen recommendations, late-night food delivery hacks, and must-try joints around college.",
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
      gradient: "from-emerald-500/20 via-cyan-500/15 to-transparent",
      accentColor: "text-emerald-500",
      tagline: "DSA questions, projects, hackathon teams, and developer banter.",
      description:
        "Everything student devs are building: hackathon project showcases, LeetCode grind survival, tech stack debates, and open-source contributions.",
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
      gradient: "from-blue-500/20 via-indigo-500/15 to-transparent",
      accentColor: "text-blue-500",
      tagline: "Interview experiences, OA tips, compensation insights & company reviews.",
      description:
        "Verified campus placement intelligence: Online Assessment (OA) walkthroughs, GD strategies, interview questions, and placement season advice from seniors.",
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
      gradient: "from-purple-500/20 via-fuchsia-500/15 to-transparent",
      accentColor: "text-purple-500",
      tagline: "PYQs, one-night study survival, question predictions & syllabus notes.",
      description:
        "The semester clutch hub: previous year questions (PYQs), professor expectations, urgent study material links, and end-semester camaraderie.",
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
    tagline: `Student conversations, experiences, and campus updates on #${clean}.`,
    description: `Real-time student discussions, stories, and debates tagged #${clean} across Indian engineering and university campuses.`,
    prompts: [
      `What's happening on your campus with #${clean}?`,
      `Share your take on #${clean}...`,
      `Ask classmates about #${clean}...`,
    ],
    relatedTags: ["#HostelLife", "#CampusLife", "#Tech", "#CampusConfessions", "#EndsemSurvivors"],
  };
}

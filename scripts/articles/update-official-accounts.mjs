import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DB_URL or DATABASE_URL");
  process.exit(1);
}

const sql = neon(connectionString);

const OFFICIAL_DESKS = {
  loop_tech: {
    displayName: "CampusLoop · Systems & Tech Desk",
    headline: "Official Systems & Software Architecture Desk",
    bio: "Official CampusLoop Technology & Systems Desk. Publishing production-grade software guides, systems programming tutorials, and modern open-source architecture playbooks for engineering students across Indian colleges.",
    branch: "Computer Science & Systems",
  },
  loop_travel: {
    displayName: "CampusLoop · Travel & Discovery Desk",
    headline: "Official Travel & Campus Discovery Desk",
    bio: "Official CampusLoop Travel & Exploration Desk. Publishing researched, student-budgeted transit guides, railway hacks, Himalayan trek blueprints, and regional discovery itineraries for Indian college students.",
    branch: "Regional Discovery & Transit",
  },
  loop_academics: {
    displayName: "CampusLoop · Academics Desk",
    headline: "Official Academic Excellence & Exam Strategy Desk",
    bio: "Official CampusLoop Academic Desk. Delivering peer-reviewed study strategies, semester preparation blueprints, university exam tactical guides, and lecture synthesis frameworks.",
    branch: "Academic Sciences & Pedagogy",
  },
  loop_ai: {
    displayName: "CampusLoop · AI & ML Desk",
    headline: "Official Applied AI & Machine Learning Desk",
    bio: "Official CampusLoop AI & ML Desk. Publishing hands-on roadmaps for LLM fine-tuning, reasoning distillation, model quantisation, and production machine learning on collegiate hardware.",
    branch: "Artificial Intelligence & Robotics",
  },
  loop_webdev: {
    displayName: "CampusLoop · Web Dev Desk",
    headline: "Official Modern Web & Distributed Systems Desk",
    bio: "Official CampusLoop Web Development Desk. Deep dives into Next.js, Cloudflare Workers, real-time edge architecture, and high-performance full-stack web applications.",
    branch: "Full-Stack Web Engineering",
  },
  loop_cybersecurity: {
    displayName: "CampusLoop · Security & Privacy Desk",
    headline: "Official Information Security & Privacy Desk",
    bio: "Official CampusLoop Security Desk. Hands-on CTF walkthroughs, defensive engineering blueprints, university network security analyses, and student account hardening.",
    branch: "Information Security & Cryptography",
  },
  loop_placements: {
    displayName: "CampusLoop · Placements Desk",
    headline: "Official Placements & Technical Recruitment Desk",
    bio: "Official CampusLoop Placements Desk. Comprehensive interview prep, campus placement breakdown reports, DSA pattern analysis, and tech recruiter insider insights.",
    branch: "Career Placement & Industry Relations",
  },
  loop_internships: {
    displayName: "CampusLoop · Internships Desk",
    headline: "Official Internships & Fellowship Opportunities Desk",
    bio: "Official CampusLoop Internships Desk. Navigating research fellowships, corporate summer internships, open-source stipends, and tactical outreach strategies.",
    branch: "Industry Internships & Fellowships",
  },
  loop_hackathons: {
    displayName: "CampusLoop · Hackathons Desk",
    headline: "Official Hackathons & Competitive Engineering Desk",
    bio: "Official CampusLoop Hackathons Desk. Rapid prototyping blueprints, pitch deck architecture, judging rubrics, and winning technical stacks for national collegiate hackathons.",
    branch: "Competitive Hackathons & Innovation",
  },
  loop_career: {
    displayName: "CampusLoop · Careers Desk",
    headline: "Official Career Architecture & Professional Growth Desk",
    bio: "Official CampusLoop Careers Desk. Strategic career roadmaps, portfolio building, resume engineering, and navigating the transition from student to software engineer.",
    branch: "Professional Career Architecture",
  },
  loop_startups: {
    displayName: "CampusLoop · Startups Desk",
    headline: "Official Student Entrepreneurship & Venture Desk",
    bio: "Official CampusLoop Startups Desk. From dorm-room prototype to venture funding: customer discovery, zero-cost architecture, legal entity formation, and incubator applications.",
    branch: "Venture Engineering & Innovation",
  },
  loop_finance: {
    displayName: "CampusLoop · Money Desk",
    headline: "Official Student Financial Literacy & Budgeting Desk",
    bio: "Official CampusLoop Personal Finance Desk. Unbiased, student-specific financial literacy: hostel budgeting, student credit cards, emergency fund frameworks, and tax basics.",
    branch: "Financial Literacy & Economics",
  },
  loop_gaming: {
    displayName: "CampusLoop · Gaming & Esports Desk",
    headline: "Official Collegiate Esports & Game Development Desk",
    bio: "Official CampusLoop Gaming Desk. Collegiate esports leagues, tournament strategies, game development engine guides, and hardware performance tuning.",
    branch: "Esports & Game Design",
  },
  loop_memes: {
    displayName: "CampusLoop · Humor & Culture Desk",
    headline: "Official Campus Culture & Satire Desk",
    bio: "Official CampusLoop Culture & Satire Desk. Documenting authentic Indian collegiate life, hostel chronicles, semester humor, and peer social dynamics.",
    branch: "Campus Satire & Cultural Studies",
  },
  loop_campuslife: {
    displayName: "CampusLoop · Campus Life Desk",
    headline: "Official Hostel Life & Campus Navigation Desk",
    bio: "Official CampusLoop Campus Life Desk. Surviving and thriving in Indian college hostels, mess navigation, room setup optimizations, and roommate dynamics.",
    branch: "Collegiate Life & Residential Living",
  },
  loop_clubs: {
    displayName: "CampusLoop · Clubs & Societies Desk",
    headline: "Official Student Societies & Campus Leadership Desk",
    bio: "Official CampusLoop Clubs & Societies Desk. Playbooks for founding, scaling, and managing collegiate technical and cultural societies, sponsorships, and events.",
    branch: "Student Governance & Leadership",
  },
  loop_design: {
    displayName: "CampusLoop · Design & Craft Desk",
    headline: "Official Product Design & Interface Craft Desk",
    bio: "Official CampusLoop Design Desk. High-craft UI/UX engineering, design tokens, accessible interface architecture, and typography standards for modern web applications.",
    branch: "Product Design & HCI",
  },
  loop_entertainment: {
    displayName: "CampusLoop · Entertainment Desk",
    headline: "Official Anime, Cinema & Pop Culture Desk",
    bio: "Official CampusLoop Entertainment Desk. Curated cinema and anime recommendations, screening licenses, campus film society culture, and media analyses.",
    branch: "Media Studies & Screen Arts",
  },
  loop_books: {
    displayName: "CampusLoop · Books & Literature Desk",
    headline: "Official Literature, Non-Fiction & Reading Desk",
    bio: "Official CampusLoop Books & Reading Desk. Technical and non-fiction reading lists, critical analysis, active reading methodologies, and campus book club blueprints.",
    branch: "Literature & Critical Thought",
  },
  loop_fitness: {
    displayName: "CampusLoop · Fitness Desk",
    headline: "Official Student Athletics & Physical Fitness Desk",
    bio: "Official CampusLoop Fitness Desk. Practical fitness frameworks for busy engineering students: hostel workouts, cafeteria nutrition hacks, and athletic training.",
    branch: "Exercise Science & Student Athletics",
  },
  loop_sports: {
    displayName: "CampusLoop · Sports Desk",
    headline: "Official Collegiate Sports & Tournaments Desk",
    bio: "Official CampusLoop Sports Desk. Inter-college tournament coverage, training schedules, athletic facilities reviews, and sportsmanship across Indian campuses.",
    branch: "Sports Management & Athletics",
  },
  loop_productivity: {
    displayName: "CampusLoop · Productivity Desk",
    headline: "Official Cognitive Performance & Study Systems Desk",
    bio: "Official CampusLoop Productivity Desk. Evidence-based study systems, active recall protocols, digital minimalism, and time management for demanding degree programs.",
    branch: "Applied Cognitive Science",
  },
  loop_robotics: {
    displayName: "CampusLoop · Robotics Desk",
    headline: "Official Embedded Systems & Robotics Desk",
    bio: "Official CampusLoop Robotics Desk. Microcontroller architecture, ROS2, sensor fusion, PCB design, and competitive robotics team preparation.",
    branch: "Robotics & Embedded Systems",
  },
  loop_food: {
    displayName: "CampusLoop · Food & Mess Desk",
    headline: "Official Hostel Dining & Student Culinary Hacks Desk",
    bio: "Official CampusLoop Food & Nutrition Desk. Mess nutrition optimization, budget meal preparation in hostels, street food hygiene, and student food safety.",
    branch: "Nutrition & Food Safety",
  },
  loop_sustainability: {
    displayName: "CampusLoop · Sustainability Desk",
    headline: "Official Green Campus & Environmental Action Desk",
    bio: "Official CampusLoop Sustainability Desk. Student-led campus sustainability projects, e-waste recycling drives, energy audits, and eco-conscious collegiate living.",
    branch: "Environmental Engineering",
  },
  loop_projects: {
    displayName: "CampusLoop · Projects Desk",
    headline: "Official Engineering Showcase & Build Desk",
    bio: "Official CampusLoop Projects Desk. Deconstructing outstanding student engineering projects, open-source portfolio builds, and end-to-end deployment architecture.",
    branch: "Software & Hardware Engineering",
  },
  loop_scholarships: {
    displayName: "CampusLoop · Scholarships Desk",
    headline: "Official Academic Grants & Merit Scholarships Desk",
    bio: "Official CampusLoop Scholarships Desk. Government scholarships, corporate diversity grants, merit awards, and application essay strategies for Indian students.",
    branch: "Educational Grants & Fellowships",
  },
  loop_studentlife: {
    displayName: "CampusLoop · Wellbeing Desk",
    headline: "Official Student Wellbeing & Mental Resilience Desk",
    bio: "Official CampusLoop Wellbeing Desk. Destigmatizing student mental health, burnout prevention, imposter syndrome navigation, and peer support systems.",
    branch: "Applied Student Psychology",
  },
  loop_opensource: {
    displayName: "CampusLoop · Open Source Desk",
    headline: "Official Open Source & Public Goods Desk",
    bio: "Official CampusLoop Open Source Desk. Navigating GSoC, LFX, Hacktoberfest, making first PRs to major open-source repositories, and community maintainership.",
    branch: "Open Source Systems",
  },
  loop_tester: {
    displayName: "CampusLoop · Platform Testing Desk",
    headline: "Official Platform Testing & Feature Verification Hub",
    bio: "Official CampusLoop Platform Testing Desk. Verifying new platform capabilities, feature releases, API workflows, and system integrations across Indian colleges.",
    branch: "Quality Assurance & Systems Testing",
  },
};

const OFFICIAL_SOCIAL_LINKS = {
  platforms: {
    instagram: "campusloop.space",
    linkedin: "company/mycampusloop",
    twitter: "mycampusloop",
    github: "SH20RAJ/campusloop",
  },
  custom: [
    { label: "CampusLoop Official Hub", url: "https://campusloop.space" },
    { label: "Official Editorial Directory", url: "https://campusloop.space/articles" },
  ],
};

async function main() {
  console.log("Upgrading all loop_* accounts to Official Platform Accounts in Neon PostgreSQL...\n");

  let totalUpdated = 0;

  for (const [username, meta] of Object.entries(OFFICIAL_DESKS)) {
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const res = await sql`
      UPDATE user_profiles
      SET
        display_name = ${meta.displayName},
        headline = ${meta.headline},
        bio = ${meta.bio},
        branch = ${meta.branch},
        avatar_url = ${avatarUrl},
        is_seeded = false,
        role = 'ADMIN',
        points = 500,
        status = 'ACTIVE',
        onboarding_completed = true,
        social_links = ${JSON.stringify(OFFICIAL_SOCIAL_LINKS)}::jsonb,
        updated_at = NOW()
      WHERE username = ${username}
      RETURNING id, username, display_name, is_seeded, role, points;
    `;

    if (res.length > 0) {
      totalUpdated++;
      console.log(`[UPDATED] @${username} -> ${res[0].display_name} (role: ${res[0].role}, is_seeded: ${res[0].is_seeded}, points: ${res[0].points})`);
    } else {
      console.log(`[WARN] No profile found for @${username}`);
    }
  }

  // Also catch any other loop_* profiles
  const genericRes = await sql`
    UPDATE user_profiles
    SET
      is_seeded = false,
      role = 'ADMIN',
      points = 500,
      status = 'ACTIVE',
      onboarding_completed = true,
      updated_at = NOW()
    WHERE username LIKE 'loop_%' AND is_seeded = true
    RETURNING id, username;
  `;
  if (genericRes.length > 0) {
    console.log(`Updated ${genericRes.length} additional loop_* accounts: ${genericRes.map(r => r.username).join(", ")}`);
  }

  // Mark all articles authored by loop_* accounts as official (is_demo = false)
  const articlesRes = await sql`
    UPDATE articles
    SET
      is_demo = false,
      status = 'PUBLISHED',
      updated_at = NOW()
    WHERE author_id IN (
      SELECT id FROM user_profiles WHERE username LIKE 'loop_%'
    )
    RETURNING id, title;
  `;

  console.log(`\nUpdated ${articlesRes.length} articles to official platform status (is_demo = false).`);
  console.log(`Successfully upgraded ${totalUpdated} official platform editorial desks!`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

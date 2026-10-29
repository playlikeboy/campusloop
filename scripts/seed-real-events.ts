import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { events } from "../src/db/schema/events";

const ORGANIZER_ID = "e446595b-d8fe-4376-9a53-d80f863dc3df";

// Real premier college events, national hackathons, cultural & technical fests in India
const REAL_EVENTS = [
  {
    id: "opp_sih_2026_national",
    slug: "smart-india-hackathon-2026",
    title: "Smart India Hackathon 2026 (SIH) — National Software Edition",
    tagline: "World's biggest open innovation hackathon solving 150+ ministry & PSU problem statements",
    description: `Smart India Hackathon (SIH 2026) is a nationwide initiative by the Ministry of Education's Innovation Cell (MIC) and AICTE to provide students with a platform to solve some of the pressing problems faced in daily lives, and thus inculcate a culture of product innovation and a mindset of problem-solving.

Themes include Smart Automation, Clean & Green Technology, Smart Vehicles, Renewable Energy, MedTech, Agriculture & Rural Development, and AI-driven Disaster Management. Over 2,000 collegiate teams compete across 40+ nodal centers throughout India for non-stop 36-hour sprint rounds.`,
    bannerUrl: null,
    clubName: "Ministry of Education & AICTE",
    institutionId: "inst_eb557a3411799af2cfa39a7d", // IIT Delhi
    eligibleInstitutionIds: ["ALL"],
    eventType: "HACKATHON",
    mode: "HYBRID",
    venue: "Designated AICTE Nodal Centers & Virtual Mentorship",
    startDate: new Date("2026-11-15T09:00:00.000Z"),
    endDate: new Date("2026-12-22T18:00:00.000Z"),
    registrationDeadline: new Date("2026-11-10T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 6,
    maxTeamSize: 6,
    maxParticipants: 10000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹1,00,000 per problem statement (₹2+ Crores total prize pool)",
    perks: ["Ministry Certificates", "Cash Prize Pool", "Incubation Support", "Loop Points"],
    loopPointsReward: 50,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_ethindia_2026_devfolio",
    slug: "ethindia-2026-asia-largest-web3-hackathon",
    title: "ETHIndia 2026 — Asia's Flagship Ethereum & Web3 Hackathon",
    tagline: "36 hours of relentless building, hacking, and shipping with 2,000+ top builders",
    description: `ETHIndia is the crown jewel of Ethereum hackathons in Asia. Hosted at the expansive KTPO Bengaluru, 2,000+ curated engineers, designers, and blockchain protocol researchers gather for 36 non-stop hours.

Featuring tracks in Account Abstraction, Zero-Knowledge proofs (zkSNARKs), Layer 2 scaling, DeFi primitives, Decentralized AI agents, and Cross-chain interoperability. Supported by leading global foundations and protocols with on-site mentors and technical workshops.`,
    bannerUrl: null,
    clubName: "Devfolio & Ethereum India",
    institutionId: "inst_cea7d61e58d794245779ef18", // RVCE
    eligibleInstitutionIds: ["ALL"],
    eventType: "HACKATHON",
    mode: "OFFLINE",
    venue: "KTPO Complex, Whitefield, Bengaluru",
    startDate: new Date("2026-12-04T09:00:00.000Z"),
    endDate: new Date("2026-12-06T18:00:00.000Z"),
    registrationDeadline: new Date("2026-11-20T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 2,
    maxTeamSize: 4,
    maxParticipants: 2200,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹50,00,000+ ($60,000+) in bounties, grants & pooled prizes",
    perks: ["Travel Grants", "Hacker House Access", "Hardware & Swag Kit", "Direct Investor Pitches"],
    loopPointsReward: 50,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_techfest_2026_iitb",
    slug: "techfest-2026-iit-bombay",
    title: "Techfest 2026 — Asia's Largest Science & Technology Festival",
    tagline: "International Robowars, Cozmo Clench, AI Drone Racing & Tech Olympiads",
    description: `Techfest is the annual science and technology festival of the Indian Institute of Technology Bombay. Established in 1998, it has grown into Asia's largest technology festival with a footfall exceeding 175,000 students.

Compete in high-stakes robotic battles at the Robowars arena, autonomous drone navigation, Algorhythm competitive programming challenge, and green hydrogen vehicle design. Includes international keynotes from Nobel Laureates and industry titans.`,
    bannerUrl: null,
    clubName: "Techfest Student Body, IIT Bombay",
    institutionId: "inst_594f59cf31f1619b6bbb2cab", // IIT Bombay
    eligibleInstitutionIds: ["ALL"],
    eventType: "FEST",
    mode: "OFFLINE",
    venue: "IIT Bombay Campus, Powai, Mumbai",
    startDate: new Date("2026-12-27T08:00:00.000Z"),
    endDate: new Date("2026-12-29T21:00:00.000Z"),
    registrationDeadline: new Date("2026-12-15T23:59:59.000Z"),
    participationType: "BOTH",
    minTeamSize: 1,
    maxTeamSize: 5,
    maxParticipants: 5000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹45,00,000+ Prize Pool + R&D Fellowship Grants",
    perks: ["Official IIT Bombay Techfest Trophies", "Industry Certifications", "Loop Points", "Accommodation"],
    loopPointsReward: 40,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_rendezvous_2026_iitd",
    slug: "rendezvous-2026-iit-delhi",
    title: "Rendezvous 2026 — North India's Premier College Cultural Festival",
    tagline: "4 days of star pronites, Battle of the Bands, Blitzkrieg Choreo, and Dramatic Arts",
    description: `Rendezvous is the annual cultural festival of the Indian Institute of Technology Delhi. Spread across four electric days and nights, RDV draws over 80,000 footfalls from colleges across India.

Flagship competitions include Blitzkrieg (Western Group Dance), Spectrum (Fashion Showcase), Dhoom (Eastern Music), and Parliamentary Debate. Evenings feature star pronites with acclaimed artists and international performers in the OAT.`,
    bannerUrl: null,
    clubName: "Board for Student Activities (BSA), IIT Delhi",
    institutionId: "inst_eb557a3411799af2cfa39a7d", // IIT Delhi
    eligibleInstitutionIds: ["ALL"],
    eventType: "CULTURAL",
    mode: "OFFLINE",
    venue: "Open Air Theatre (OAT) & Dogra Hall, IIT Delhi",
    startDate: new Date("2026-11-20T10:00:00.000Z"),
    endDate: new Date("2026-11-23T23:00:00.000Z"),
    registrationDeadline: new Date("2026-11-14T23:59:59.000Z"),
    participationType: "BOTH",
    minTeamSize: 1,
    maxTeamSize: 12,
    maxParticipants: 8000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹15,00,000+ Cash Rewards + National Talent Scouting",
    perks: ["Celebrity Meet & Greet", "Verified Certificates", "Artist Passports", "Loop Points"],
    loopPointsReward: 35,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_waves_2026_bits_goa",
    slug: "waves-2026-bits-pilani-goa",
    title: "Waves '26 — All-India Cultural Festival of BITS Pilani Goa",
    tagline: "Searock band competition, Natyanjali dance face-off, and beachfront music nights",
    description: `Waves is the premier annual cultural extravaganza of BITS Pilani, K.K. Birla Goa Campus. Bringing together students from all across the country to celebrate music, dance, art, literature, and cinema in the tropical campus of Zuarinagar, Goa.

Home to Searock — India's oldest semi-professional rock and metal band competition. Experience unmatched energy, EDM nights, and high-adrenaline campus competitions.`,
    bannerUrl: null,
    clubName: "Department of Creative Arts & BITS Goa Student Union",
    institutionId: "inst_91eb1ca09bece8c0cf0f0a1f", // BITS Goa
    eligibleInstitutionIds: ["ALL"],
    eventType: "CULTURAL",
    mode: "OFFLINE",
    venue: "BITS Pilani Goa Campus, Zuarinagar, Goa",
    startDate: new Date("2026-11-13T10:00:00.000Z"),
    endDate: new Date("2026-11-15T23:30:00.000Z"),
    registrationDeadline: new Date("2026-11-05T23:59:59.000Z"),
    participationType: "BOTH",
    minTeamSize: 1,
    maxTeamSize: 10,
    maxParticipants: 4000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹10,50,000+ Cash Pool + Recording Studio Contracts",
    perks: ["Festival Merchandise", "Pro-Night Passes", "BITS Goa Certificates", "Loop Points"],
    loopPointsReward: 35,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_flipkart_grid_2026",
    slug: "flipkart-grid-7-tech-challenge",
    title: "Flipkart GRiD 7.0 — National Engineering Campus Challenge",
    tagline: "Autonomous robotics, Generative AI & deep-tech supply chain problem statements",
    description: `Flipkart GRiD is Flipkart's flagship national engineering campus challenge. Now in its 7th edition, GRiD invites students across India to tackle real-world e-commerce technological hurdles through rigorous design and coding rounds.

Tracks include:
1. Generative AI for Visual & Conversational Commerce
2. Autonomous Last-Mile Delivery & Warehouse Robotics
3. High-throughput distributed ledger architectures

Top performing finalists earn Pre-Placement Interviews (PPI) and direct SDE offers at Flipkart with salaries upwards of ₹32 LPA.`,
    bannerUrl: null,
    clubName: "Flipkart Engineering & Campus Relations",
    institutionId: "inst_594f59cf31f1619b6bbb2cab", // IIT Bombay
    eligibleInstitutionIds: ["ALL"],
    eventType: "COMPETITION",
    mode: "ONLINE",
    venue: "Unstop Assessment Engine & Virtual Live Finals",
    startDate: new Date("2026-11-10T14:00:00.000Z"),
    endDate: new Date("2026-12-18T20:00:00.000Z"),
    registrationDeadline: new Date("2026-11-08T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 2,
    maxTeamSize: 3,
    maxParticipants: 15000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹10,00,000 Cash Pool + Direct SDE Interview (PPI) Fast-Track",
    perks: ["Flipkart Mentorship", "Direct Interview Calls", "Fast-Track Hiring", "Loop Points"],
    loopPointsReward: 45,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_tcs_codevita_2026",
    slug: "tcs-codevita-season-13",
    title: "TCS CodeVita Season 13 — Global Programming Championship",
    tagline: "Guinness World Record holder for the largest competitive programming contest",
    description: `TCS CodeVita is the world's premier competitive programming championship organized by Tata Consultancy Services. It promotes the philosophy of 'Programming-As-A-Sport' and invites collegiate coders from across 90+ countries.

Contestants solve complex algorithmic problems within a 6-hour round using Python, C++, Java, or Rust. Top finalists fly to India for the Grand Finale with top corporate and digital engineering roles.`,
    bannerUrl: null,
    clubName: "TCS Campus Commune",
    institutionId: "inst_cea7d61e58d794245779ef18", // RVCE
    eligibleInstitutionIds: ["ALL"],
    eventType: "CONTEST",
    mode: "ONLINE",
    venue: "TCS iON Secure Assessment Browser",
    startDate: new Date("2026-11-28T09:00:00.000Z"),
    endDate: new Date("2026-11-30T18:00:00.000Z"),
    registrationDeadline: new Date("2026-11-22T23:59:59.000Z"),
    participationType: "SOLO",
    minTeamSize: 1,
    maxTeamSize: 1,
    maxParticipants: 50000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "$20,000 (₹16,50,000+) Global Cash Prize + TCS Digital/Prime Job Offers",
    perks: ["Direct Job Offers", "Global Rankings", "Verified Certificate", "Loop Points"],
    loopPointsReward: 40,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_hackthisfall_2026",
    slug: "hack-this-fall-2026",
    title: "Hack This Fall 2026 — Innovate For Good Hackathon",
    tagline: "India's friendliest student developer community hackathon with 1,500+ hackers",
    description: `Hack This Fall is one of India's most loved student developer communities, partnering with Major League Hacking (MLH) and leading technology ecosystems.

Dedicated to fostering inclusion, learning, and open-source contributions. 36 hours of non-stop hacking with beginner-friendly mentorship, fun mini-events, resume reviews by Silicon Valley engineers, and generous cloud credits.`,
    bannerUrl: null,
    clubName: "Hack This Fall & MLH Student Chapter",
    institutionId: "inst_350001b58916dd63843af94c", // IIT Gandhinagar
    eligibleInstitutionIds: ["ALL"],
    eventType: "HACKATHON",
    mode: "HYBRID",
    venue: "Karnavati Campus & Virtual Discord Guild",
    startDate: new Date("2026-11-20T11:00:00.000Z"),
    endDate: new Date("2026-11-22T19:00:00.000Z"),
    registrationDeadline: new Date("2026-11-12T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 2,
    maxTeamSize: 4,
    maxParticipants: 1800,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹8,50,000+ in Cash, Open Source Bounties & Cloud Credits",
    perks: ["MLH Swag Kits", "GitHub Goodie Boxes", "Digital Badges", "Loop Points"],
    loopPointsReward: 40,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_loreal_brandstorm_2026",
    slug: "loreal-brandstorm-2026",
    title: "L'Oréal Brandstorm 2026 — Global Student Innovation Case Challenge",
    tagline: "Reinvent the future of beauty and sustainable commerce with AR, AI & biotechnology",
    description: `L'Oréal Brandstorm is one of the world's most prestigious business and innovation competitions for undergraduate and master's students. Over 30 years, it has transformed student concepts into market reality.

Pitch disruptive tech solutions combining augmented reality, sustainable packaging, and personal care algorithms. National winners represent India at the global finals in Paris, competing for a 3-month paid intrapreneurship mission at Station F.`,
    bannerUrl: null,
    clubName: "L'Oréal Campus Innovation Lab",
    institutionId: "inst_eb557a3411799af2cfa39a7d", // IIT Delhi
    eligibleInstitutionIds: ["ALL"],
    eventType: "COMPETITION",
    mode: "HYBRID",
    venue: "Virtual Submissions & Mumbai National Finale",
    startDate: new Date("2026-11-12T10:00:00.000Z"),
    endDate: new Date("2027-01-25T18:00:00.000Z"),
    registrationDeadline: new Date("2026-11-25T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 3,
    maxTeamSize: 3,
    maxParticipants: 6000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "3-Month Paid Intrapreneurship Mission at L'Oréal Headquarters in Paris",
    perks: ["All-Expenses-Paid Paris Trip", "Executive Mentorship", "Direct Internship Fast-Track", "Loop Points"],
    loopPointsReward: 50,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_icpc_india_2026",
    slug: "acm-icpc-india-regional-contest-2026",
    title: "ACM ICPC India Regional Contest 2026 — The Olympics of Programming",
    tagline: "Collegiate algorithmic championship — road to the ICPC World Finals",
    description: `The International Collegiate Programming Contest (ICPC) is the oldest, largest, and most prestigious algorithmic programming competition in the world.

Indian regional rounds hosted at Amritapuri, Kanpur, and Gwalior test algorithmic thinking, advanced graph theory, dynamic programming, and numerical computation under strict 5-hour time limits with one shared computer per team.`,
    bannerUrl: null,
    clubName: "ICPC India Regional Council & Coders Club",
    institutionId: "inst_0d3559d2fb4d9cca1a962485", // IIT Indore
    eligibleInstitutionIds: ["ALL"],
    eventType: "CONTEST",
    mode: "OFFLINE",
    venue: "Designated On-Site Computer Centers (Amritapuri / Kanpur)",
    startDate: new Date("2026-12-12T08:00:00.000Z"),
    endDate: new Date("2026-12-14T19:00:00.000Z"),
    registrationDeadline: new Date("2026-11-15T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 3,
    maxTeamSize: 3,
    maxParticipants: 1200,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "Medals, ICPC World Finals qualification & Global Big-Tech Sponsorship Awards",
    perks: ["ICPC Finalist Badges", "Direct Big-Tech Recruiting", "Certificate of Honor", "Loop Points"],
    loopPointsReward: 50,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_tata_crucible_2026",
    slug: "tata-crucible-campus-quiz-2026",
    title: "Tata Crucible Campus Quiz 2026 — India's Premier Business Quiz",
    tagline: "Hosted by ace quizmaster Giri 'Pickbrain' Balasubramaniam",
    description: `Tata Crucible Campus Quiz is India's largest and most eagerly anticipated business quiz for college students. Over the past two decades, it has set benchmarks in student quizzing across business history, tech disruptions, brands, and economics.

Online cluster rounds lead up to thrilling zonal and national in-person finals. Test your curiosity and lateral thinking against India's sharpest collegiate minds.`,
    bannerUrl: null,
    clubName: "Tata Group Campus Initiatives",
    institutionId: "inst_594f59cf31f1619b6bbb2cab", // IIT Bombay
    eligibleInstitutionIds: ["ALL"],
    eventType: "COMPETITION",
    mode: "HYBRID",
    venue: "Online Prelims & Taj In-Person National Finals",
    startDate: new Date("2026-11-18T15:00:00.000Z"),
    endDate: new Date("2026-12-10T19:30:00.000Z"),
    registrationDeadline: new Date("2026-11-12T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 2,
    maxTeamSize: 2,
    maxParticipants: 5000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹2,50,000 Grand Prize + Taj Experiences & Trophies",
    perks: ["National Television Telecast", "Tata Crucible Trophies", "Taj Hospitality", "Loop Points"],
    loopPointsReward: 35,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_genai_masterclass_2026",
    slug: "hands-on-generative-ai-agentic-masterclass-2026",
    title: "Generative AI & Autonomous Agentic Workflows Masterclass",
    tagline: "Build multi-agent LLM systems with LangGraph, Claude 3.5 Sonnet, and local Ollama",
    description: `A fast-paced, hands-on technical workshop series led by campus AI researchers and alumni working at top AI labs. Learn to build autonomous agents capable of tool-calling, reflection loops, vector database retrieval (Qdrant), and code execution.

All attendees receive live cloud compute vouchers, starter GitHub templates, and complete step-by-step documentation for their portfolios.`,
    bannerUrl: null,
    clubName: "Google Developer Groups (GDG) on Campus & AI Club",
    institutionId: "inst_cea7d61e58d794245779ef18", // RVCE
    eligibleInstitutionIds: ["ALL"],
    eventType: "WORKSHOP",
    mode: "HYBRID",
    venue: "Turing Seminar Hall & Live YouTube Stream",
    startDate: new Date("2026-11-07T10:00:00.000Z"),
    endDate: new Date("2026-11-08T17:00:00.000Z"),
    registrationDeadline: new Date("2026-11-06T23:59:59.000Z"),
    participationType: "SOLO",
    minTeamSize: 1,
    maxTeamSize: 1,
    maxParticipants: 1000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "Verified Certificate of Completion, GPU Compute Credits & Swags",
    perks: ["Cloud GPU Vouchers", "Verified Completion Credential", "Source Code Spec", "Loop Points"],
    loopPointsReward: 30,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_esummit_2026_iitb",
    slug: "e-summit-2026-iit-bombay",
    title: "E-Summit '26: The Entrepreneurship Summit at IIT Bombay",
    tagline: "The Ten Minute Million (TTMM), Seed Stars, and India's Top Unicorn Founders",
    description: `E-Summit is the flagship annual entrepreneurship summit organized by the Entrepreneurship Cell at IIT Bombay. Recognized by UNESCO and Make in India, E-Summit bridges the gap between ambitious student builders and India's top venture capitalists.

Flagship events include 'The Ten Minute Million' (10-minute on-the-spot angel funding), National Entrepreneurship Challenge, and the Startup Expo showcasing 100+ innovative campus ventures.`,
    bannerUrl: null,
    clubName: "The Entrepreneurship Cell (E-Cell), IIT Bombay",
    institutionId: "inst_594f59cf31f1619b6bbb2cab", // IIT Bombay
    eligibleInstitutionIds: ["ALL"],
    eventType: "FEST",
    mode: "HYBRID",
    venue: "Convocation Hall & Victor Menezes Convention Centre, IIT Bombay",
    startDate: new Date("2026-12-05T09:00:00.000Z"),
    endDate: new Date("2026-12-07T21:00:00.000Z"),
    registrationDeadline: new Date("2026-11-26T23:59:59.000Z"),
    participationType: "BOTH",
    minTeamSize: 1,
    maxTeamSize: 4,
    maxParticipants: 4500,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹1,00,00,000+ On-The-Spot Angel Term Sheets & Incubation Grants",
    perks: ["Angel Investor Access", "IIT Bombay E-Summit Pass", "Pitch Decks Review", "Loop Points"],
    loopPointsReward: 40,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_saarang_2027_iitm",
    slug: "saarang-2027-iit-madras",
    title: "Saarang 2027 — South India's Largest Student Cultural Festival",
    tagline: "5 days of classical arts, electronic music nights, EDM, and choreo arena",
    description: `Saarang is the ISO 9001:2015 certified annual cultural festival of IIT Madras, attracting over 70,000 students from more than 500 colleges across India.

Features iconic pronites: Classical Night, Choreo Night, Rock Night, and EDM Night with world-renowned artists at the Open Air Theatre (OAT). With over 100 competitive events across arts, dramatics, debation, and music.`,
    bannerUrl: null,
    clubName: "Saarang Organizing Committee, IIT Madras",
    institutionId: "inst_594f59cf31f1619b6bbb2cab", // IIT Bombay / IIT Madras
    eligibleInstitutionIds: ["ALL"],
    eventType: "CULTURAL",
    mode: "OFFLINE",
    venue: "Open Air Theatre (OAT), IIT Madras Campus, Chennai",
    startDate: new Date("2027-01-08T09:00:00.000Z"),
    endDate: new Date("2027-01-12T23:00:00.000Z"),
    registrationDeadline: new Date("2026-12-28T23:59:59.000Z"),
    participationType: "BOTH",
    minTeamSize: 1,
    maxTeamSize: 8,
    maxParticipants: 10000,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹15,00,000+ Total Cash Prizes & Artist Mentorships",
    perks: ["Saarang All-Access Pass", "National Media Coverage", "Verified Certificates", "Loop Points"],
    loopPointsReward: 35,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_redbull_campus_clutch_2026",
    slug: "red-bull-campus-clutch-2026-india",
    title: "Red Bull Campus Clutch 2026 — National College Valorant Championship",
    tagline: "University Valorant esports tournament culminating in the World Finals",
    description: `Red Bull Campus Clutch is the biggest global university esports tournament for Riot Games' tactical shooter VALORANT. Students compete representing their campus through online qualifiers, national playoffs, and LAN stage finals.

National champions win the coveted trip to represent India at the Red Bull Campus Clutch World Final in Europe with an international prize pool of €20,000.`,
    bannerUrl: null,
    clubName: "Red Bull Gaming & Campus Esports Union",
    institutionId: "inst_91eb1ca09bece8c0cf0f0a1f", // BITS Goa
    eligibleInstitutionIds: ["ALL"],
    eventType: "SPORTS",
    mode: "HYBRID",
    venue: "Online Discord Tournament & LAN Arena Finals",
    startDate: new Date("2026-11-25T14:00:00.000Z"),
    endDate: new Date("2026-12-15T22:00:00.000Z"),
    registrationDeadline: new Date("2026-11-18T23:59:59.000Z"),
    participationType: "TEAM",
    minTeamSize: 5,
    maxTeamSize: 6,
    maxParticipants: 1500,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "₹5,00,000 INR Cash Pool + All-Expenses-Paid World Final Trip",
    perks: ["Official Red Bull Gaming Merch", "VIP LAN Passes", "Live Esports Stream", "Loop Points"],
    loopPointsReward: 35,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
  {
    id: "opp_solana_summer_camp_2026",
    slug: "web3-solana-developer-fellowship-2026",
    title: "Solana Student Fellowship: Rust & On-Chain Systems (Superteam India)",
    tagline: "4-week cohort-based fellowship building high-performance decentralized applications",
    description: `Superteam India and the Solana Foundation present an intensive, stipend-backed fellowship designed specifically for engineering undergraduates. Master Rust systems programming, Anchor framework, Solana Program Library (SPL), and sub-second DeFi architectures.

Top graduation projects receive immediate grant funding of $2,500 to $10,000 from the Superteam ecosystem fund.`,
    bannerUrl: null,
    clubName: "Superteam India & Campus Blockchain Guild",
    institutionId: "inst_cea7d61e58d794245779ef18", // RVCE
    eligibleInstitutionIds: ["ALL"],
    eventType: "FELLOWSHIP",
    mode: "ONLINE",
    venue: "Live Cohort on Gather & Discord",
    startDate: new Date("2026-11-16T12:00:00.000Z"),
    endDate: new Date("2026-12-14T20:00:00.000Z"),
    registrationDeadline: new Date("2026-11-11T23:59:59.000Z"),
    participationType: "SOLO",
    minTeamSize: 1,
    maxTeamSize: 1,
    maxParticipants: 500,
    isPaid: false,
    entryFee: "Free",
    prizesDescription: "$10,000+ Grant Pool & $500 Weekly Builder Stipends",
    perks: ["Builder Stipend", "Ecosystem Grants", "Superteam Member Status", "Loop Points"],
    loopPointsReward: 50,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  },
];

async function seed() {
  console.log("Seeding real events from the internet...");
  const db = getDb();
  let created = 0;
  let updated = 0;

  for (const item of REAL_EVENTS) {
    const existing = await db.query.events.findFirst({
      where: eq(events.id, item.id),
    });

    if (existing) {
      await db
        .update(events)
        .set({
          slug: item.slug,
          title: item.title,
          tagline: item.tagline,
          description: item.description,
          bannerUrl: item.bannerUrl,
          clubName: item.clubName,
          institutionId: item.institutionId,
          eligibleInstitutionIds: item.eligibleInstitutionIds,
          eventType: item.eventType,
          mode: item.mode,
          venue: item.venue,
          startDate: item.startDate,
          endDate: item.endDate,
          registrationDeadline: item.registrationDeadline,
          participationType: item.participationType,
          minTeamSize: item.minTeamSize,
          maxTeamSize: item.maxTeamSize,
          maxParticipants: item.maxParticipants,
          isPaid: item.isPaid,
          entryFee: item.entryFee,
          prizesDescription: item.prizesDescription,
          perks: item.perks,
          loopPointsReward: item.loopPointsReward,
          status: item.status,
          visibility: item.visibility,
          updatedAt: new Date(),
        })
        .where(eq(events.id, item.id));
      updated++;
      console.log(`Updated: ${item.title}`);
    } else {
      await db.insert(events).values({
        ...item,
        organizerProfileId: ORGANIZER_ID,
      });
      created++;
      console.log(`Inserted: ${item.title}`);
    }
  }

  console.log(`Done! Seeded ${created} new events, updated ${updated} events.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });

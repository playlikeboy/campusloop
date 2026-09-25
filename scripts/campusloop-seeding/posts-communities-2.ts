/**
 * CampusLoop Community Discussion Posts Batch 2 (Additional Community Coverage)
 * Covering: Cloud/DevOps, Robotics, Lost & Found, Freelancers, Finance/Investing, Product Management, Chess, CyberSec
 */
import type { RawPostItem } from "./posts-feed";

export const COMMUNITY_POSTS_BATCH_2: RawPostItem[] = [
  // Cloud, DevOps & SRE Station (cloud-devops-sre)
  {
    id: "seed_202609_post_261",
    authorIndex: 5,
    institutionKey: "igdtuw",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "cloud-devops-sre",
    title: "Kubernetes pod resource limits: Requests vs Limits explained",
    body: "Setting `resources.requests.memory` tells the kube-scheduler where to place the pod based on guaranteed capacity. Setting `resources.limits.memory` is a hard ceiling: if your Node/Go process exceeds it, the Linux kernel invokes the OOMKiller and terminates the container with exit code 137. Always set memory limits to prevent memory leaks from starving neighbouring pods on the worker node.",
    upvotes: 39,
  },
  {
    id: "seed_202609_post_262",
    authorIndex: 0,
    institutionKey: "iitd",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "cloud-devops-sre",
    title: "Why we switched our student project from AWS EC2 to Cloudflare Workers",
    body: "We were paying $18/month for an idle t3.micro EC2 instance just to run a lightweight campus dining API that only receives traffic at lunch and dinner. Porting to Cloudflare Workers (V8 isolates at edge) reduced cold starts to 0ms, eliminated server maintenance, and stayed comfortably within the 100,000 free daily request tier. Serverless edge is perfect for university projects.",
    upvotes: 44,
  },

  // Robotics, Embedded & Hardware Labs (robotics-embedded-hardware)
  {
    id: "seed_202609_post_263",
    authorIndex: 2,
    institutionKey: "bitmesra",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "robotics-embedded-hardware",
    title: "ESP32 FreeRTOS multitasking tutorial: Reading sensors without blocking WiFi",
    body: "If you call `delay(1000)` inside `loop()`, your ESP32 drops incoming WebSocket packets and freezes HTTP server tasks. Instead, pin sensor polling to Core 0 with `xTaskCreatePinnedToCore()` and let the network stack handle incoming requests on Core 1. Dual-core microcontrollers should be treated like concurrent systems!",
    upvotes: 36,
  },
  {
    id: "seed_202609_post_264",
    authorIndex: 40,
    institutionKey: "nitdelhi",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "robotics-embedded-hardware",
    title: "PCB design checklist before submitting gerber files to fabrication",
    body: "1. Run DRC (Design Rule Check) with fab manufacturer constraints (minimum 6 mil trace/space).\n2. Add decoupling capacitors (100nF) right next to IC power pins.\n3. Make power traces at least 20-30 mil thick to avoid voltage drop.\n4. Ensure ground plane has no isolated copper islands.\nSave this before your next JLCPCB order!",
    upvotes: 41,
  },

  // Cybersecurity & CTF Operatives (cybersec-ctf)
  {
    id: "seed_202609_post_265",
    authorIndex: 11,
    institutionKey: "vitap",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "cybersec-ctf",
    title: "Beginner's roadmap to cracking your first CTF competition",
    body: "CTFs are divided into 5 standard categories: Web, Crypto, Forensics, Rev (Reverse Engineering), and Pwn (Binary Exploitation). Start with PicoCTF: solve the 50-point web challenges (inspecting page source, modifying cookies, basic SQL injections), then learn Ghidra for reverse engineering simple binaries. The dopamine of finding your first flag is unmatched.",
    upvotes: 48,
  },
  {
    id: "seed_202609_post_266",
    authorIndex: 28,
    institutionKey: "igdtuw",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "cybersec-ctf",
    title: "SQL Injection demonstration: Why parameterized prepared statements are mandatory",
    body: "Concatenating user input directly into SQL strings (`'SELECT * FROM users WHERE name = \'' + input + '\''`) allows input like `' OR '1'='1` to bypass all authentication. Prepared statements separate query bytecode compilation from parameter data values, making injection physically impossible at the database driver level.",
    upvotes: 45,
  },

  // Campus Lost & Found Central (lost-and-found-central)
  {
    id: "seed_202609_post_267",
    authorIndex: 2,
    institutionKey: "bitmesra",
    type: "NORMAL",
    scope: "CAMPUS",
    communitySlug: "lost-and-found-central",
    title: "FOUND: Casio scientific calculator (FX-991CW) in Room 214",
    body: "Left on the 3rd bench after the 11:30 AM Electrical Machines lecture. Has a small blue sticker on the back cover. Handed it over to the lab attendant in Room 212. Identify the serial number or the sticker design to claim it.",
    upvotes: 25,
  },
  {
    id: "seed_202609_post_268",
    authorIndex: 24,
    institutionKey: "dtu",
    type: "NORMAL",
    scope: "CAMPUS",
    communitySlug: "lost-and-found-central",
    title: "LOST: Black wireless earphone case (boAt Airdopes) near Tennis Courts",
    body: "Misplaced around 5:30 PM yesterday evening while walking from the sports complex to Canteen 2. Has my initial 'S' scratched near the charging port. Please message me if you picked it up!",
    upvotes: 18,
  },

  // Freelancers, Gigs & Client Work (freelancers-client-work)
  {
    id: "seed_202609_post_269",
    authorIndex: 8,
    institutionKey: "manipal",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "freelancers-client-work",
    title: "How to price your web design & dev contracts as a college student",
    body: "Never charge hourly when starting out — clients will question why a bug took 3 hours to fix. Charge per project milestone:\n- Milestone 1: Wireframes & visual designs in Figma (30% upfront)\n- Milestone 2: Functional staging deployment (40%)\n- Milestone 3: Production domain launch & handover (30%).\nNever deploy to their live domain until the final payment is cleared in your account.",
    upvotes: 56,
  },
  {
    id: "seed_202609_post_270",
    authorIndex: 1,
    institutionKey: "iiitd",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "freelancers-client-work",
    title: "Handling difficult clients who demand endless revisions",
    body: "Include this sentence in your initial proposal contract: 'Project includes up to 2 rounds of design revisions. Additional revision rounds or changes to approved wireframes will be billed at ₹1,500/hour.' The moment revisions have a price tag, clients suddenly become remarkably clear about what they actually want.",
    upvotes: 49,
  },

  // Finance, Stocks & Investing Club (finance-stocks-investing)
  {
    id: "seed_202609_post_271",
    authorIndex: 19,
    institutionKey: "nitdelhi",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "finance-stocks-investing",
    title: "Demystifying P/E ratio, Market Cap, and Balance Sheets for beginners",
    body: "Before you buy random stocks based on Telegram tips: Price-to-Earnings (P/E) tells you how much investors are willing to pay for ₹1 of company earnings. Compare a stock's P/E against its historical average and its direct industry peers. A company with growing free cash flows and zero debt is almost always a safer investment than a hyped narrative.",
    upvotes: 43,
  },
  {
    id: "seed_202609_post_272",
    authorIndex: 42,
    institutionKey: "iitd",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "finance-stocks-investing",
    title: "The math of rupee cost averaging: Why market dips are your friend",
    body: "When you invest ₹1,000 every month consistently via SIP, you buy fewer units when prices are high, and automatically buy more units when the market crashes. Over a 5-10 year horizon, this mathematical averaging smooths out market volatility without ever needing to predict market tops or bottoms.",
    upvotes: 47,
  },

  // Product Management & Case Studies (product-management-cases)
  {
    id: "seed_202609_post_273",
    authorIndex: 1,
    institutionKey: "iiitd",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "product-management-cases",
    title: "Product Teardown: How Duolingo uses streaks and gamification for D30 retention",
    body: "Duolingo's primary engagement moat isn't language lessons — it's loss aversion tied to the 'Streak' counter. Features like Streak Freeze, Double or Nothing wagers, and widget alerts on iOS home screens trigger dopamine loops that maintain daily active usage even when learners are busy. Great case study for student product managers.",
    upvotes: 51,
  },
  {
    id: "seed_202609_post_274",
    authorIndex: 27,
    institutionKey: "bitmesra",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "product-management-cases",
    title: "Guesstimate framework for APM interviews: Step-by-step breakdown",
    body: "Question: 'Estimate the number of cups of tea consumed daily on your university campus.'\n1. State clarifying assumptions (campus student population = 6,000; hosteler vs day scholar split = 80/20).\n2. Segment by user personas (non-tea drinkers = 30%, light drinkers = 1 cup/day, heavy exam grinders = 3 cups/day).\n3. Add faculty and canteen footfall.\n4. Sanity check with canteen vendor batch sizes. Interviewers care about structured logic, not the exact number.",
    upvotes: 48,
  },

  // Campus Chess & Tactical Strategy (campus-chess-strategy)
  {
    id: "seed_202609_post_275",
    authorIndex: 6,
    institutionKey: "jadavpur",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "campus-chess-strategy",
    title: "The solid Caro-Kann defense: Why 1...c6 is ideal for university players",
    body: "Tired of getting blown off the board by hyper-aggressive e4 King's Gambit lines? The Caro-Kann allows Black to contest the center with d5 without locking in the light-squared bishop like the French Defense does. Solid endgame pawn structure that frustrates tactical attackers.",
    upvotes: 37,
  },
  {
    id: "seed_202609_post_276",
    authorIndex: 24,
    institutionKey: "iiitd",
    type: "NORMAL",
    scope: "GLOBAL",
    communitySlug: "campus-chess-strategy",
    title: "Weekly campus tactical puzzle: White to move and win material",
    body: "Position: White has Queen on d1, Rook on e1, Bishop on c4, Knight on f3. Black has King on e8, Queen on d8, Knight on f6. Notice the uncastled Black King on the open e-file! What is White's most forceful continuation? Drop your moves in algebraic notation below!",
    upvotes: 32,
  },
];

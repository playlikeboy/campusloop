/**
 * CampusLoop Threaded Comments & Replies Catalog (200+ comments)
 * 
 * Provides authentic, multi-perspective student dialogue:
 * - Direct answers and troubleshooting
 * - Respectful disagreements & counter-arguments
 * - Humorous quips and relatable reactions
 * - Nested discussion threads (parent -> child replies)
 */

export interface SeedCommentItem {
  id: string;
  postId: string;
  authorIndex?: number;
  isAnonymous?: boolean;
  pseudonym?: string;
  body: string;
  minAfter: number;
  replies?: {
    id: string;
    authorIndex?: number;
    isAnonymous?: boolean;
    pseudonym?: string;
    body: string;
    minAfter: number;
  }[];
}

export const SEED_COMMENTS: SeedCommentItem[] = [
  // Discussion on Post 001 (Senior advice)
  {
    id: "seed_202609_cm_001",
    postId: "seed_202609_post_001",
    authorIndex: 10,
    body: "Needed to hear this today. Spent all of last week jumping between Flutter, Rust, and Next.js and ended up feeling like I know nothing well.",
    minAfter: 14,
    replies: [
      {
        id: "seed_202609_cm_002",
        authorIndex: 0,
        body: "Totally normal in 1st year! Pick one compiled language and stick with it until you can implement a balanced binary tree without looking at documentation.",
        minAfter: 26,
      },
      {
        id: "seed_202609_cm_003",
        authorIndex: 24,
        body: "Strongly agree. C++ STL fundamentals helped me in every single OA round this placement season.",
        minAfter: 45,
      },
    ],
  },
  {
    id: "seed_202609_cm_004",
    postId: "seed_202609_post_001",
    authorIndex: 1,
    body: "Counter-opinion: Exploring multiple tech stacks early helps you discover whether you enjoy systems, frontend craft, or data engineering. Don't be afraid to dabble for a month before committing.",
    minAfter: 35,
    replies: [
      {
        id: "seed_202609_cm_005",
        authorIndex: 0,
        body: "Fair point! Dabbling to find your interest is great, but breadth without depth becomes a problem when technical rounds arrive.",
        minAfter: 52,
      },
    ],
  },

  // Discussion on Post 002 (Day 1 Placement)
  {
    id: "seed_202609_cm_006",
    postId: "seed_202609_post_002",
    authorIndex: 20,
    body: "Congratulations bhaiya! Quick question: how heavily did they grill on the project architecture vs pure DSA?",
    minAfter: 18,
    replies: [
      {
        id: "seed_202609_cm_007",
        authorIndex: 27,
        body: "Round 1 was 100% DSA (two medium leetcode questions). Round 2 spent 25 minutes grilling my database choices (why Postgres over MongoDB, how indexes worked).",
        minAfter: 32,
      },
    ],
  },
  {
    id: "seed_202609_cm_008",
    postId: "seed_202609_post_002",
    authorIndex: 2,
    body: "Huge inspiration for ECE students sitting for software companies! Celebrating at IC canteen on you this weekend!",
    minAfter: 25,
  },

  // Discussion on Post 003 (Portfolio advice)
  {
    id: "seed_202609_cm_009",
    postId: "seed_202609_post_003",
    authorIndex: 8,
    body: "This is 100% true. I had a weather app on my resume and the interviewer literally smiled and said 'Okay, what else did you build?' Built a campus cab-pooling app instead and that dominated the interview.",
    minAfter: 22,
    replies: [
      {
        id: "seed_202609_cm_010",
        authorIndex: 1,
        body: "Exactly! When you solve a real problem, you can discuss user feedback, edge cases, and unexpected bugs naturally.",
        minAfter: 38,
      },
    ],
  },

  // Discussion on Post 006 (TCP vs UDP)
  {
    id: "seed_202609_cm_011",
    postId: "seed_202609_post_006",
    authorIndex: 0,
    body: "In fast-paced multiplayer games, fresh data is more valuable than old accurate data. If your player position packet was sent 100ms ago and dropped, retransmitting it via TCP is useless because you have already moved! The game client uses client-side prediction to smooth out the missing packet.",
    minAfter: 12,
    replies: [
      {
        id: "seed_202609_cm_012",
        authorIndex: 10,
        body: "Whoa, that makes so much sense! So TCP would cause 'rubber-banding' because it would wait for the dropped packet to arrive before updating!",
        minAfter: 19,
      },
      {
        id: "seed_202609_cm_013",
        authorIndex: 11,
        body: "Spot on! That's why VoIP audio calls also use UDP — a half-second stutter is better than your call freezing to buffer 10 seconds of old audio.",
        minAfter: 28,
      },
    ],
  },

  // Discussion on Post 011 (Worst lecture timing poll)
  {
    id: "seed_202609_cm_014",
    postId: "seed_202609_post_011",
    authorIndex: 20,
    body: "2:00 PM post-lunch lab is a medical hazard. You have 3 rotis and rice in your stomach, the lab AC is humming like a lullaby, and the professor is explaining op-amp slew rates in monotone.",
    minAfter: 8,
    replies: [
      {
        id: "seed_202609_cm_015",
        authorIndex: 4,
        body: "Fighting for your life trying to keep your eyelids open while breadboarding resistors.",
        minAfter: 16,
      },
      {
        id: "seed_202609_cm_016",
        authorIndex: 21,
        body: "Monday 8 AM is still worse because your brain is still in Sunday night gaming mode.",
        minAfter: 24,
      },
    ],
  },

  // Discussion on Post 015 (Attendance rule debate)
  {
    id: "seed_202609_cm_017",
    postId: "seed_202609_post_015",
    authorIndex: 14,
    body: "Compulsory attendance treats 21-year-old adults like primary school children. Top universities worldwide evaluate students on deliverables, projects, and rigorous exams, not on warm bodies occupying wooden chairs.",
    minAfter: 15,
    replies: [
      {
        id: "seed_202609_cm_018",
        authorIndex: 27,
        body: "While I agree in principle, when colleges remove attendance completely, classroom attendance drops to 8 students out of 120. A compromise of 60% with project exemptions makes the most sense.",
        minAfter: 31,
      },
      {
        id: "seed_202609_cm_019",
        authorIndex: 6,
        body: "If a lecture is engaging and adds value beyond reading the textbook slides, students attend voluntarily. Attendance mandates are often used to compensate for uninspired teaching.",
        minAfter: 42,
      },
    ],
  },

  // Discussion on Post 020 (Hostel WiFi meme)
  {
    id: "seed_202609_cm_020",
    postId: "seed_202609_post_020",
    isAnonymous: true,
    pseudonym: "anon_wifi_sufferer",
    body: "The Wi-Fi router on our floor is located directly above the water cooler. Every time someone fills their bottle, the signal drops by two bars.",
    minAfter: 11,
    replies: [
      {
        id: "seed_202609_cm_021",
        authorIndex: 2,
        body: "Water absorbs 2.4 GHz radio frequency waves! Your water cooler is literally an RF attenuator haha!",
        minAfter: 20,
      },
      {
        id: "seed_202609_cm_022",
        authorIndex: 20,
        body: "Engineering students analyzing why their Wi-Fi sucks using electromagnetic wave theory instead of studying for the quiz.",
        minAfter: 27,
      },
    ],
  },

  // Discussion on Post 026 (Shipped micro-SaaS)
  {
    id: "seed_202609_cm_023",
    postId: "seed_202609_post_026",
    authorIndex: 0,
    body: "Huge congratulations! How did you integrate payments legally in India for international/domestic students? Did you use Cashfree, Razorpay, or Stripe?",
    minAfter: 16,
    replies: [
      {
        id: "seed_202609_cm_024",
        authorIndex: 8,
        body: "Used Lemon Squeezy (Merchant of Record). They handle all GST compliance, global VAT, and Indian cards seamlessly without needing a registered LLP on day 1.",
        minAfter: 29,
      },
      {
        id: "seed_202609_cm_025",
        authorIndex: 19,
        body: "Super smart choice for student indie builders. Will test out your tool for our finance society PDFs!",
        minAfter: 37,
      },
    ],
  },

  // Discussion on Post 101 (Confession - studying from tomorrow)
  {
    id: "seed_202609_cm_026",
    postId: "seed_202609_post_101",
    authorIndex: 23,
    body: "I feel personally attacked by this confession. I have a whole timetable drawn in colored sketch pens that expired 3 weeks ago.",
    minAfter: 9,
    replies: [
      {
        id: "seed_202609_cm_027",
        isAnonymous: true,
        pseudonym: "anon_procrastinator",
        body: "The sketch pen timetable is the universal sign of impending academic panic.",
        minAfter: 18,
      },
    ],
  },

  // Discussion on Post 102 (Waved at wrong person)
  {
    id: "seed_202609_cm_028",
    postId: "seed_202609_post_102",
    authorIndex: 10,
    body: "The inspecting-the-brick-wall maneuver is a classic. Another solid recovery is smoothly transitioning the wave into scratching the back of your head.",
    minAfter: 14,
    replies: [
      {
        id: "seed_202609_cm_029",
        authorIndex: 1,
        body: "I tried that once and knocked my own glasses off onto the pavement. Would not recommend.",
        minAfter: 25,
      },
    ],
  },

  // Discussion on Post 111 (Crush confession in ECE)
  {
    id: "seed_202609_cm_030",
    postId: "seed_202609_post_111",
    authorIndex: 21,
    body: "Go talk to her! ECE Section B has a lab tomorrow at 2 PM. Just ask what book she's reading. Life is too short to admire from across the canteen.",
    minAfter: 22,
    replies: [
      {
        id: "seed_202609_cm_031",
        isAnonymous: true,
        pseudonym: "anon_hopeful_romantic",
        body: "My hands shake when I even order food at the counter. But maybe tomorrow I'll actually say something!",
        minAfter: 34,
      },
      {
        id: "seed_202609_cm_032",
        authorIndex: 41,
        body: "Rooting for you bro! Keep us updated on CampusLoop!",
        minAfter: 48,
      },
    ],
  },

  // Discussion on Post 201 (Server actions vs API routes)
  {
    id: "seed_202609_cm_033",
    postId: "seed_202609_post_201",
    authorIndex: 34,
    body: "Great summary! Also remember that Server Actions run sequentially per client session unless you wrap them carefully, whereas API routes can be scaled and cached at edge CDN layers effortlessly.",
    minAfter: 19,
    replies: [
      {
        id: "seed_202609_cm_034",
        authorIndex: 0,
        body: "Very true. For feed scrolling and infinite pagination, standard GET endpoints with `Cache-Control` headers beat server actions every time.",
        minAfter: 32,
      },
    ],
  },

  // Discussion on Post 205 (LoRA fine tuning)
  {
    id: "seed_202609_cm_035",
    postId: "seed_202609_post_205",
    authorIndex: 18,
    body: "Did you use QLoRA (4-bit NF4 quantization) with bitsandbytes, or pure 16-bit LoRA? We noticed minor loss spikes when rank was set below 16 on mathematical reasoning benchmarks.",
    minAfter: 27,
    replies: [
      {
        id: "seed_202609_cm_036",
        authorIndex: 3,
        body: "Used QLoRA with double quantization! Rank 16 with alpha 32 kept loss stable. Rank 8 degraded multi-step reasoning noticeably.",
        minAfter: 41,
      },
    ],
  },

  // Discussion on Post 220 (SQL Interview Questions)
  {
    id: "seed_202609_cm_037",
    postId: "seed_202609_post_220",
    authorIndex: 35,
    body: "Bookmark this post everyone! I was literally asked question #1 and #4 in my Goldman Sachs technical round yesterday.",
    minAfter: 15,
    replies: [
      {
        id: "seed_202609_cm_038",
        authorIndex: 10,
        body: "Did they ask you to write raw SQL or explain indexing strategies for the join?",
        minAfter: 28,
      },
      {
        id: "seed_202609_cm_039",
        authorIndex: 35,
        body: "Both! First write the query, then explain how hash join vs nested loop join executes under the hood.",
        minAfter: 36,
      },
    ],
  },

  // Discussion on Post 231 (Hostel Maggi recipes)
  {
    id: "seed_202609_cm_040",
    postId: "seed_202609_post_231",
    authorIndex: 4,
    body: "You forgot Tier S+: Cooking Maggi with crushed garlic sautéed in Amul butter. The aroma fills the entire 3rd floor wing within 90 seconds.",
    minAfter: 12,
    replies: [
      {
        id: "seed_202609_cm_041",
        authorIndex: 20,
        body: "The whole wing suddenly showing up with empty bowls asking 'Bhai thoda milega kya?'",
        minAfter: 21,
      },
      {
        id: "seed_202609_cm_042",
        authorIndex: 21,
        body: "Hostel tax is real. A 2-pack Maggi becomes a 2-spoon sample size for the cook.",
        minAfter: 31,
      },
    ],
  },

  // Additional Discussion Threads
  {
    id: "seed_202609_cm_043",
    postId: "seed_202609_post_240",
    authorIndex: 12,
    body: "Sattu drink in the morning is genuinely underrated. High fiber, 20g clean plant protein, and costs ₹15 per glass. Best Indian student superfood.",
    minAfter: 18,
    replies: [
      {
        id: "seed_202609_cm_044",
        authorIndex: 4,
        body: "Add a pinch of roasted cumin (jeera) and black salt and it tastes incredible on hot days.",
        minAfter: 33,
      },
    ],
  },
  {
    id: "seed_202609_cm_045",
    postId: "seed_202609_post_248",
    authorIndex: 51,
    body: "Saving this post forever. As a final year student, the memories of sitting on the grass talking until sunrise with my roommates are what I will treasure for the rest of my life.",
    minAfter: 24,
    replies: [
      {
        id: "seed_202609_cm_046",
        authorIndex: 27,
        body: "Wishing you the absolute best for convocation! Stay in touch with your squad.",
        minAfter: 42,
      },
    ],
  },
  {
    id: "seed_202609_cm_047",
    postId: "seed_202609_post_277",
    authorIndex: 35,
    body: "One of the coolest computer science demonstrations. Modern superscalar CPUs are marvels of hardware engineering.",
    minAfter: 29,
  },
  {
    id: "seed_202609_cm_048",
    postId: "seed_202609_post_287",
    authorIndex: 10,
    body: "Option A is terrifying. You practice 300 hard DP problems and then freeze on how to reverse a singly linked list because of panic.",
    minAfter: 16,
    replies: [
      {
        id: "seed_202609_cm_049",
        authorIndex: 20,
        body: "Happened to me in my first mock interview! Just take a sip of water, take a breath, and draw it out on paper.",
        minAfter: 28,
      },
    ],
  },
  {
    id: "seed_202609_cm_050",
    postId: "seed_202609_post_300",
    authorIndex: 3,
    body: "Powai campus will always be home. Best of luck to the graduating batch! You've got this.",
    minAfter: 20,
  },
];

/**
 * Free course sources imported from official YouTube channels.
 * See .claude/skills/add-courses/SKILL.md for how to add one.
 *
 * source:
 *   UNIVERSITY: universities and their official course channels (MIT, Stanford, CMU,
 *               Caltech, DeepLearning.AI). Ranked just below CS50.
 *   CREATOR:    independent educators (mostly Indian YouTubers). Ranked lower
 *               than universities until students rate them on CampusLoop.
 *
 * include: only playlists whose title matches are imported (plus the global
 *          topic filter in import-youtube.ts). maxCourses keeps big channels
 *          from flooding the catalog (largest matching playlists win).
 */

export type SourceKind = "UNIVERSITY" | "CREATOR";

export interface CourseSource {
  key: string;
  name: string;
  handle: string;
  kind: SourceKind;
  language: "English" | "Hindi";
  bio: string;
  category?: string;
  include?: RegExp;
  exclude?: RegExp;
  maxCourses?: number;
  minVideos?: number;
  /** Explicit playlists (always imported, bypassing filters). */
  playlists?: string[];
  /** Removed from the start of playlist titles (e.g. NPTEL's "Computer Sc - "). */
  stripTitle?: RegExp;
  license?: string;
}

export const SOURCES: CourseSource[] = [
  // Universities and official course channels
  {
    key: "harvard",
    name: "Harvard University",
    handle: "@harvard",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Harvard University public courses, including Michael Sandel's world-renowned Justice lecture series.",
    category: "Law & Policy",
    include: /(Justice with Michael Sandel)/i,
    playlists: ["PL30C13C91CFFEFEA6"],
    maxCourses: 1,
  },
  {
    key: "mru",
    name: "Marginal Revolution University",
    handle: "@MarginalRevolutionUniversity",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Tyler Cowen and Alex Tabarrok's university-level microeconomics, macroeconomics, and trade lectures.",
    category: "Economics",
    maxCourses: 6,
  },
  {
    key: "ycombinator",
    name: "Y Combinator",
    handle: "@ycombinator",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Y Combinator's Startup School: lectures on finding ideas, building products, and scaling startups.",
    category: "Entrepreneurship",
    include: /(Startup School|How to Start a Startup)/i,
    maxCourses: 4,
  },
  {
    key: "crashcourse",
    name: "CrashCourse",
    handle: "@crashcourse",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Fast-paced, high-yield university-level courses across psychology, economics, philosophy, and sociology.",
    playlists: [
      "PL8dPuuaLjXtPNZwz5_o_5uirJ8gQXnhEO", // Economics
      "PL8dPuuaLjXtOPRKzVLY0jJY-uHOH9KVU6", // Psychology
      "PL8dPuuaLjXtNgK6MZucdYldNkMybYIHKR", // Philosophy
      "PL8dPuuaLjXtMBsfP-lP28IFvfkISqJofM", // Business Soft Skills
      "PL8dPuuaLjXtMJ-AfB_7J1538YKWkZAnGA", // Sociology
      "PL8dPuuaLjXtMsMTfmRomkVQG8AqrAmJFX", // European History
    ],
    maxCourses: 6,
  },
  {
    key: "figma",
    name: "Figma",
    handle: "@Figma",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Official Figma design courses on UI/UX fundamentals, auto layout, and scalable design systems.",
    category: "Design",
    include: /(Figma for Beginners|Auto Layout|Design Systems)/i,
    maxCourses: 4,
  },
  {
    key: "profleonard",
    name: "Professor Leonard",
    handle: "@ProfessorLeonard",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Professor Leonard's university mathematics lectures: Calculus 1, 2, 3, and Differential Equations.",
    category: "Mathematics",
    playlists: [
      "PLF797E961509B4EB5",
      "PLDesaqWTN6EQ2J4vgsN1HyBeRADEh4Cw-",
      "PLDesaqWTN6ESk16YRmzuJ8f6-rnuy0Ry7",
    ],
    maxCourses: 4,
  },
  {
    key: "mit",
    name: "MIT OpenCourseWare",
    handle: "@mitocw",
    kind: "UNIVERSITY",
    language: "English",
    bio: "MIT OpenCourseWare publishes materials from thousands of MIT courses, free for anyone, under Creative Commons.",
    // Core CS, AI, maths, physics, chemistry, and economics courses.
    include: /\b(6\.0001|6\.0002|6\.006|6\.042J?|6\.046J?|6\.034|6\.036|6\.390|6\.172|6\.004|6\.001|6\.858|6\.5660|6\.851|6\.7960|6\.S191|6\.041|6\.1200J?|6\.1210|6\.1220|6\.5060|18\.06|18\.01|18\.02|18\.03|18\.065|18\.404J?|6\.840J?|18\.650|8\.01|8\.02|14\.01|5\.111)\b/,
    playlists: [
      "PLyQSN7X0ro203puVhQsmCj9qhlFQ-As8e", // Physics 8.01
      "PLUl4u3cNGP60V7HxLYRaJMbFzP77bzEjb", // Economics 14.01
      "PLUl4u3cNGP63LOmB3_O0xbgZVZibxj4rb", // Chemistry 5.111
    ],
    maxCourses: 35,
    license: "CC BY-NC-SA 4.0",
  },
  {
    key: "stanford",
    name: "Stanford Online",
    handle: "@stanfordonline",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Stanford Online shares full recorded Stanford courses, including Andrew Ng's CS229 Machine Learning.",
    include: /\b(CS ?\d{3}[A-Z]?|EE ?\d{3}|Machine Learning|Deep Learning|Natural Language|Transformers)\b/i,
    maxCourses: 20,
  },
  {
    key: "stanford-eng",
    name: "Stanford University School of Engineering",
    handle: "@StanfordEngineering",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Full lecture series from Stanford Engineering courses such as CS231n and CS106.",
    include: /\b(CS ?\d{3}[A-Z]?|Programming|Algorithms|Convolutional|Machine Learning)\b/i,
    exclude: /COVID/i,
    maxCourses: 10,
  },
  {
    key: "deeplearningai",
    name: "DeepLearning.AI (Andrew Ng)",
    handle: "@Deeplearningai",
    kind: "UNIVERSITY",
    language: "English",
    bio: "DeepLearning.AI, founded by Andrew Ng, teaches machine learning and deep learning to millions of learners.",
    include: /(Deep Learning|Neural Networks|Machine Learning|Convolutional|Sequence Models|Structuring|Improving|Hyperparameter|NLP|Generative)/i,
    exclude: /Heroes/i,
    maxCourses: 12,
  },
  {
    key: "cmu-db",
    name: "CMU Database Group",
    handle: "@CMUDatabaseGroup",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Carnegie Mellon University's database courses by Andy Pavlo and team (15-445/645 and 15-721).",
    include: /(15-?445|15-?721|Database Systems|Intro to Database|Advanced Database)/i,
    maxCourses: 6,
  },
  {
    key: "caltech",
    name: "Caltech",
    handle: "@caltech",
    kind: "UNIVERSITY",
    language: "English",
    bio: "California Institute of Technology. Includes Yaser Abu-Mostafa's Learning From Data course.",
    include: /(Learning From Data|Machine Learning|Computer Science|Quantum Computing)/i,
    maxCourses: 4,
  },
  {
    key: "3b1b",
    name: "3Blue1Brown",
    handle: "@3blue1brown",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Grant Sanderson's visual explanations of mathematics, used in university courses worldwide.",
    include: /(Linear algebra|Calculus|Neural networks|Differential equations|Probability)/i,
    minVideos: 4,
    maxCourses: 6,
  },
  {
    key: "karpathy",
    name: "Andrej Karpathy",
    handle: "@AndrejKarpathy",
    kind: "UNIVERSITY",
    language: "English",
    bio: "Founding member of OpenAI and former Director of AI at Tesla. Neural Networks: Zero to Hero builds GPT from scratch.",
    include: /(Zero to Hero|Neural)/i,
    minVideos: 4,
    maxCourses: 2,
  },
  {
    key: "nptel",
    name: "NPTEL (IITs and IISc)",
    handle: "@iit",
    kind: "UNIVERSITY",
    language: "English",
    bio: "NPTEL is the IITs' and IISc's national programme for free engineering course videos.",
    stripTitle: /^(Computer Sc(ience)?( and Engineering)?|Computer|Electronics|Mathematics)\s*-\s+/i,
    include: /(Data ?Structures|Algorithm|Database|Operating System|Computer Network|Compiler|Theory of Computation|Programming|Machine Learning|Deep Learning|Artificial Intelligence|Discrete Math|Computer Architecture|Software Engineering|Cloud Computing|Cryptography|Python|Java|C\+\+)/i,
    maxCourses: 25,
  },

  // Indian educators & specialized creators
  {
    key: "gajendrapurohit",
    name: "Dr. Gajendra Purohit",
    handle: "@DrGajendraPurohit",
    kind: "CREATOR",
    language: "Hindi",
    bio: "Dr. Gajendra Purohit's complete engineering mathematics, calculus, linear algebra, and discrete maths series.",
    category: "Mathematics",
    playlists: [
      "PLU6SqdYcYsfLPxjd-k-MaoG7qgRQ-2fKc",
      "PLU6SqdYcYsfIuZVt20v-eNZBfFLENrM1F",
      "PLU6SqdYcYsfJqbZvQECrwnlQrp4fg6isX",
    ],
    maxCourses: 4,
  },
  {
    key: "allaboutelectronics",
    name: "ALL ABOUT ELECTRONICS",
    handle: "@ALLABOUTELECTRONICS",
    kind: "CREATOR",
    language: "English",
    bio: "Visual, structured tutorials on operational amplifiers, digital electronics, analog circuits, and network theory.",
    category: "Electronics & Communication",
    exclude: /(Quiz|Members Only)/i,
    maxCourses: 8,
  },
  {
    key: "engineeringfunda",
    name: "Engineering Funda",
    handle: "@EngineeringFunda",
    kind: "CREATOR",
    language: "English",
    bio: "Hitesh Dholakiya's university exam lectures on DSP, microprocessors, microcontrollers, VLSI, and communication systems.",
    category: "Electronics & Communication",
    maxCourses: 8,
  },
  {
    key: "efficientengineer",
    name: "The Efficient Engineer",
    handle: "@TheEfficientEngineer",
    kind: "CREATOR",
    language: "English",
    bio: "Engineering concepts animated: strength of materials, fluid mechanics, and thermodynamics.",
    category: "Mechanical Engineering",
    maxCourses: 6,
  },
  {
    key: "accountingstuff",
    name: "Accounting Stuff",
    handle: "@AccountingStuff",
    kind: "CREATOR",
    language: "English",
    bio: "James Hearle's beginner-to-advanced financial accounting, balance sheets, and bookkeeping courses.",
    category: "Finance & Accounting",
    exclude: /(Quiz|2 Minute)/i,
    maxCourses: 6,
  },
  {
    key: "ninjanerd",
    name: "Ninja Nerd",
    handle: "@NinjaNerdOfficial",
    kind: "CREATOR",
    language: "English",
    bio: "Zach Murphy and team's in-depth clinical medicine, physiology, anatomy, and pathology lectures.",
    category: "Medicine",
    include: /(Physiology|Anatomy|Pharmacology|Pathology|Biochemistry|Microbiology)/i,
    maxCourses: 8,
  },
  {
    key: "designcourse",
    name: "DesignCourse",
    handle: "@DesignCourse",
    kind: "CREATOR",
    language: "English",
    bio: "Gary Simon's UI/UX, Figma, typography, and design systems tutorials for modern web and mobile apps.",
    category: "Design",
    include: /(UI\/UX|Figma|Mobile App Design)/i,
    maxCourses: 4,
  },
  { key: "codewithharry", name: "CodeWithHarry", handle: "@CodeWithHarry", kind: "CREATOR", language: "Hindi", bio: "Haris Ali Khan's channel teaching programming and web development in Hindi to millions of students.", maxCourses: 20 },
  { key: "campusx", name: "CampusX", handle: "@campusx-official", kind: "CREATOR", language: "Hindi", bio: "Nitish Singh's in-depth data science, machine learning, deep learning and generative AI courses in Hindi.", maxCourses: 20 },
  { key: "gatesmashers", name: "Gate Smashers", handle: "@GateSmashers", kind: "CREATOR", language: "Hindi", bio: "Varun Singla's GATE and university exam lectures on DBMS, OS, networks, COA, TOC and more.", maxCourses: 20 },
  { key: "neso", name: "Neso Academy", handle: "@nesoacademy", kind: "CREATOR", language: "English", bio: "Structured, chapter-wise lectures on computer science and electronics fundamentals.", exclude: /(GATE Solved)/i, maxCourses: 25 },
  { key: "apnacollege", name: "Apna College", handle: "@ApnaCollegeOfficial", kind: "CREATOR", language: "Hindi", bio: "Shradha Khapra and Aman Dhattarwal's beginner-friendly courses on programming, DSA and web development.", maxCourses: 12 },
  { key: "shradha", name: "Shradha Khapra", handle: "@shradhaKD", kind: "CREATOR", language: "Hindi", bio: "Coding courses for college students by Apna College co-founder Shradha Khapra.", maxCourses: 6 },
  { key: "jenny", name: "Jenny's Lectures CS IT", handle: "@JennyslecturesCSIT", kind: "CREATOR", language: "English", bio: "Jayanti Khatri Lamba's lectures on data structures, C, Java, DBMS, OS and more.", maxCourses: 15 },
  { key: "abdulbari", name: "Abdul Bari", handle: "@abdul_bari", kind: "CREATOR", language: "English", bio: "Abdul Bari's widely followed algorithms lectures.", maxCourses: 4, minVideos: 4 },
  { key: "striver", name: "take U forward (Striver)", handle: "@takeUforward", kind: "CREATOR", language: "English", bio: "Raj Vikramaditya (Striver)'s DSA series for placements: graphs, DP, trees, binary search and more.", maxCourses: 15 },
  { key: "kunal", name: "Kunal Kushwaha", handle: "@KunalKushwaha", kind: "CREATOR", language: "English", bio: "Java with DSA and DevOps bootcamps by Kunal Kushwaha.", maxCourses: 6 },
  { key: "codehelp", name: "CodeHelp by Babbar", handle: "@CodeHelp", kind: "CREATOR", language: "Hindi", bio: "Love Babbar's DSA, web development and placement courses in Hindi.", maxCourses: 10 },
  { key: "telusko", name: "Telusko", handle: "@Telusko", kind: "CREATOR", language: "English", bio: "Navin Reddy's Java, Spring, Python and backend courses.", maxCourses: 15 },
  { key: "chaiaurcode", name: "Chai aur Code", handle: "@chaiaurcode", kind: "CREATOR", language: "Hindi", bio: "Hitesh Choudhary's Hindi courses on JavaScript, React, backend, Python and more.", maxCourses: 15 },
  { key: "hitesh", name: "Hitesh Choudhary", handle: "@HiteshCodeLab", kind: "CREATOR", language: "English", bio: "Hitesh Choudhary's English courses on JavaScript, Python, React and full stack development.", maxCourses: 12 },
  { key: "krishnaik", name: "Krish Naik", handle: "@krishnaik06", kind: "CREATOR", language: "English", bio: "Krish Naik's machine learning, deep learning, statistics and generative AI playlists.", maxCourses: 15 },
  { key: "codebasics", name: "codebasics", handle: "@codebasics", kind: "CREATOR", language: "English", bio: "Dhaval Patel's practical data analysis, Python, ML and deep learning tutorials.", maxCourses: 12 },
  { key: "coderarmy", name: "Coder Army", handle: "@CoderArmy9", kind: "CREATOR", language: "Hindi", bio: "Rohit Negi's DSA, C++ and system design courses in Hindi.", maxCourses: 10 },
  { key: "5min", name: "5 Minutes Engineering", handle: "@5MinutesEngineering", kind: "CREATOR", language: "Hindi", bio: "Short, exam-focused computer engineering lectures in Hindi.", maxCourses: 12 },
  { key: "easyeng", name: "Easy Engineering Classes", handle: "@EasyEngineeringClasses", kind: "CREATOR", language: "Hindi", bio: "University exam lectures on computer science subjects in Hindi.", exclude: /(CBSE|Class 1[12]|UGC NET)/i, maxCourses: 12 },
  { key: "adityaverma", name: "Aditya Verma", handle: "@TheAdityaVerma", kind: "CREATOR", language: "Hindi", bio: "Aditya Verma's famous pattern-based series on dynamic programming, recursion, binary search and more.", maxCourses: 8, minVideos: 5 },
  { key: "pepcoding", name: "Pepcoding", handle: "@Pepcoding", kind: "CREATOR", language: "Hindi", bio: "Sumeet Malik's data structures and algorithms lectures.", maxCourses: 12 },
  { key: "anujbhaiya", name: "Anuj Bhaiya", handle: "@AnujBhaiya", kind: "CREATOR", language: "Hindi", bio: "Java, DSA and placement preparation by Anuj Bhaiya.", maxCourses: 6 },
  { key: "akshaysaini", name: "Akshay Saini", handle: "@akshaymarch7", kind: "CREATOR", language: "English", bio: "Namaste JavaScript: deep dives into how JavaScript really works.", maxCourses: 4, minVideos: 4 },
  { key: "thapa", name: "Thapa Technical", handle: "@ThapaTechnical", kind: "CREATOR", language: "Hindi", bio: "Vinod Thapa's Hindi web development courses: HTML, CSS, JavaScript, React and Node.", maxCourses: 12 },
  { key: "learncoding", name: "Learn Coding", handle: "@LearnCodingofficial", kind: "CREATOR", language: "Hindi", bio: "Anil Kumar's computer science and programming lectures in Hindi.", maxCourses: 10 },
  { key: "sudhakar", name: "Sudhakar Atchala", handle: "@sudhakaratchala", kind: "CREATOR", language: "English", bio: "Engineering subject lectures for university exams.", maxCourses: 10 },
  { key: "gkcs", name: "Gaurav Sen", handle: "@gkcs", kind: "CREATOR", language: "English", bio: "Gaurav Sen's system design lectures, a reference for interview preparation.", maxCourses: 4, minVideos: 5 },
  { key: "arpit", name: "Arpit Bhayani", handle: "@AsliEngineering", kind: "CREATOR", language: "English", bio: "Arpit Bhayani's deep dives into system design, databases and distributed systems.", maxCourses: 6, minVideos: 5 },
  { key: "harkirat", name: "Harkirat Singh", handle: "@harkirat1", kind: "CREATOR", language: "Hindi", bio: "Harkirat Singh's full stack, web3 and DevOps sessions.", maxCourses: 4 },
  { key: "neetcode", name: "NeetCode", handle: "@NeetCode", kind: "CREATOR", language: "English", bio: "Coding interview problem walkthroughs organised by pattern.", maxCourses: 8 },
  { key: "fiset", name: "WilliamFiset", handle: "@WilliamFiset-videos", kind: "CREATOR", language: "English", bio: "Clear animated lectures on data structures and graph theory.", maxCourses: 4 },
];

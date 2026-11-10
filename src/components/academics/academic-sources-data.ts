export type AcademicSourceCategory =
  | "Official University Archive"
  | "Curated Student Hub"
  | "National Repository"
  | "State Tech Board";

export interface AcademicSource {
  id: string;
  name: string;
  university: string;
  category: AcademicSourceCategory;
  description: string;
  coverage: string;
  /** Short label for what the site mostly has. No counts: we don't verify them. */
  offers: string;
  officialUrl: string;
  campusLoopFilterUrl: string;
  highlights: string[];
}

export const SOURCE_CATEGORY_LABELS: Record<AcademicSourceCategory, string> = {
  "Official University Archive": "University archive",
  "Curated Student Hub": "Student site",
  "National Repository": "National",
  "State Tech Board": "State university",
};

export const VERIFIED_ACADEMIC_SOURCES: AcademicSource[] = [
  {
    id: "bit-mesra-archive",
    name: "BIT Mesra exam paper archive",
    university: "Birla Institute of Technology, Mesra",
    category: "Official University Archive",
    description: "The college's own page of past mid-sem and end-sem question papers.",
    coverage:
      "CSE, ECE, EEE, Mech, Civil, BioTech, Chemical, Architecture, HMCT, Management, Pharmacy, Sciences",
    offers: "Past papers",
    officialUrl: "https://bitmesra.ac.in/Other-Department-Pages/content/1/258/361",
    campusLoopFilterUrl: "/academics?scope=campus",
    highlights: ["Mid-sem and end-sem papers", "PDF downloads", "Semesters 1 to 8"],
  },
  {
    id: "bithub",
    name: "BitHub",
    university: "BIT Mesra students",
    category: "Curated Student Hub",
    description: "Student-run site with notes, lab manuals and semester study guides.",
    coverage: "Physics and Chemistry cycles, 2nd to 4th year core subjects",
    offers: "Notes and lab manuals",
    officialUrl: "https://bithub.co.in",
    campusLoopFilterUrl: "/academics?resourceType=NOTES",
    highlights: ["Lab manuals", "Multisim circuits", "First-year cycles"],
  },
  {
    id: "bitsyll",
    name: "BitSyll",
    university: "BIT Mesra CBCS programs",
    category: "Curated Student Hub",
    description: "Course syllabus list with credits, electives and subject codes.",
    coverage: "B.Tech, B.Arch, B.Pharm, M.Tech and MBA",
    offers: "Syllabus",
    officialUrl: "https://bitsyll.com",
    campusLoopFilterUrl: "/academics",
    highlights: ["Subject codes", "Credit schemes", "Prerequisites"],
  },
  {
    id: "semester-notes",
    name: "Semester-Notes",
    university: "Open GitHub repo",
    category: "National Repository",
    description: "Lecture notes, code and formula sheets for core CS subjects.",
    coverage: "DSA, OS, DBMS, Networks, TOC, Compiler Design, Maths",
    offers: "Notes",
    officialUrl: "https://github.com/madhurimarawat/Semester-Notes",
    campusLoopFilterUrl: "/academics?branch=Computer%20Science",
    highlights: ["Handwritten unit notes", "Diagrams", "Revision sheets"],
  },
  {
    id: "csai-archive",
    name: "BTech CSAI study archive",
    university: "Open GitHub repo",
    category: "Curated Student Hub",
    description: "Notes, problem sets and assignments for AI and ML courses.",
    coverage: "Machine Learning, Deep Learning, Numerical Methods, Computer Vision, NLP",
    offers: "Notes and assignments",
    officialUrl: "https://github.com/ashishtiwari-07/BTech-CSAI-Study-Archive",
    campusLoopFilterUrl: "/academics?branch=Computer%20Science",
    highlights: ["AI/ML notebooks", "Solved numericals", "Unit question banks"],
  },
  {
    id: "aktu-quantum",
    name: "AKTU",
    university: "Dr. A.P.J. Abdul Kalam Technical University",
    category: "State Tech Board",
    description: "Official AKTU site. Quantum notes and past papers for affiliated colleges.",
    coverage: "CSE, IT, ECE, EE, ME, Civil (semesters 1 to 8)",
    offers: "Past papers",
    officialUrl: "https://aktu.ac.in",
    campusLoopFilterUrl: "/academics?scope=global",
    highlights: ["Past question papers", "Unit-wise prep", "Exam answers"],
  },
  {
    id: "vtu-resource",
    name: "VTU Resource",
    university: "Visvesvaraya Technological University",
    category: "State Tech Board",
    description: "Model papers, solved papers and notes for VTU colleges in Karnataka.",
    coverage: "2018, 2021 and 2022 scheme engineering programs",
    offers: "Model papers and notes",
    officialUrl: "https://vturesource.com",
    campusLoopFilterUrl: "/academics?scope=global",
    highlights: ["Model question papers", "Scheme-wise notes", "Solved papers"],
  },
  {
    id: "jntuh-notes",
    name: "JNTUH Notes",
    university: "JNTU Hyderabad",
    category: "State Tech Board",
    description: "R18 and R22 notes, past papers and lab manuals for Telangana colleges.",
    coverage: "B.Tech and B.Pharmacy, all branches",
    offers: "Notes and past papers",
    officialUrl: "https://jntuhnotes.net",
    campusLoopFilterUrl: "/academics?scope=global",
    highlights: ["R18 and R22 notes", "Important questions", "Lab manuals"],
  },
  {
    id: "anna-univ-brainkart",
    name: "BrainKart",
    university: "Anna University, Chennai",
    category: "State Tech Board",
    description: "Regulation 2017 and 2021 notes with 2-mark and 16-mark answers.",
    coverage: "Aero, Mech, ECE, CSE, IT, Civil, EEE, Biotech",
    offers: "Notes and answers",
    officialUrl: "https://brainkart.com",
    campusLoopFilterUrl: "/academics?scope=global",
    highlights: ["2-mark and 16-mark answers", "2021 syllabus", "Derivations"],
  },
  {
    id: "nptel-iit",
    name: "NPTEL",
    university: "IITs and IISc",
    category: "National Repository",
    description: "Free online courses with lecture videos, slides and assignments.",
    coverage: "Engineering, Computer Science, Sciences, Management, Humanities",
    offers: "Courses",
    officialUrl: "https://nptel.ac.in",
    campusLoopFilterUrl: "/academics",
    highlights: ["Lecture videos", "Assignments", "Transcripts"],
  },
];

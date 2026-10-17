import type { SmartBlockType } from "./smart-blocks";

/** Starter content inserted by the editor's slash menu. Each one renders as-is. */
export const SMART_BLOCK_TEMPLATES: Record<SmartBlockType, { title: string; description: string; body: string }> = {
  chart: {
    title: "Chart",
    description: "Bar, line, area or pie chart from a small table.",
    body: "type: bar\ntitle: Average package by branch\nunit: LPA\nsource: Placement cell report, 2026\nbranch, average\nCSE, 14.2\nECE, 10.8\nEEE, 8.9\nMechanical, 7.1",
  },
  table: {
    title: "Smart table",
    description: "Sortable table; numeric columns can be charted.",
    body: "| Hostel | Rooms | Rent (₹/month) |\n| --- | --- | --- |\n| H1 | 120 | 4500 |\n| H5 | 96 | 5200 |\n| H11 | 140 | 3900 |",
  },
  comparison: {
    title: "Comparison",
    description: "Side-by-side options with pros, cons and a verdict.",
    body: "title: Hostel or PG?\nverdict: Hostel for first year, PG once you know the city.\n## Hostel\nCheaper and close to class.\n+ Mess included\n+ Easy to make friends\n- Strict timings\nbest for: First years\n## PG\nMore freedom, more cost.\n+ Flexible timings\n- Commute\n- Deposit needed\nbest for: Seniors and interns",
  },
  timeline: {
    title: "Timeline",
    description: "Dates and milestones, one per line.",
    body: "title: Placement season\nJul | Resume deadline | Upload to the TPO portal\nAug | Aptitude tests | Most companies test online\nSep | Interviews | Two to three rounds\nOct | Offers",
  },
  steps: {
    title: "Steps",
    description: "A checklist readers can tick off.",
    body: "title: Apply for a branch change\nCheck your CGPA against the cutoff\nDownload the form from the academic portal\nGet your HOD's signature\nSubmit before the deadline",
  },
  callout: {
    title: "Callout",
    description: "Highlight a tip, note, warning or success.",
    body: "tone: tip\nBook lab slots on Sunday night; they open at 9 pm and fill in minutes.",
  },
  stats: {
    title: "Key numbers",
    description: "Up to eight headline stats.",
    body: "source: Campus survey, Sep 2026 (n=412)\n68% | Use the library daily | Up from 51% last year\n4.2 | Avg sleep on exam week | hours\n₹3,100 | Monthly food spend | median",
  },
  calculator: {
    title: "Calculator",
    description: "Interactive inputs and live results.",
    body: JSON.stringify(
      {
        title: "Split your flat rent",
        inputs: [
          { id: "rent", label: "Monthly rent", default: 18000, min: 0, max: 60000, step: 500, unit: "₹" },
          { id: "bills", label: "Bills and Wi-Fi", default: 2500, min: 0, max: 10000, step: 100, unit: "₹" },
          { id: "people", label: "Flatmates", default: 3, min: 1, max: 8, step: 1 },
        ],
        outputs: [
          { label: "Each person pays", formula: "(rent + bills) / people", unit: "₹", decimals: 0 },
          { label: "Per year, each", formula: "(rent + bills) / people * 12", unit: "₹", decimals: 0 },
        ],
      },
      null,
      2
    ),
  },
  quiz: {
    title: "Quiz",
    description: "One question with instant feedback.",
    body: JSON.stringify(
      {
        question: "Which data structure gives O(1) average lookup by key?",
        options: ["Linked list", "Hash map", "Binary search tree", "Stack"],
        answer: 1,
        explanation: "Hash maps index buckets by hash, so average lookup is constant time.",
      },
      null,
      2
    ),
  },
  embed: {
    title: "Embed",
    description: "YouTube, X, Reddit, CodePen, Figma, Docs, Maps and 25+ more.",
    body: "caption: Harvard CS50 Week 0, starting at the binary demo\nstart: 12:30\nhttps://www.youtube.com/watch?v=3LPJfIKxwWc",
  },
  faq: {
    title: "FAQ",
    description: "Expandable questions and answers.",
    body: "Q: Is attendance compulsory?\nA: 75% per subject, or you may be barred from end-sems.\nQ: Can I change my elective?\nA: Within the first two weeks, through the academic office.",
  },
};

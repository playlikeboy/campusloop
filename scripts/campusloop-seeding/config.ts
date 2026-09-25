/**
 * CampusLoop 500+ Content Seeding & Community Ignition Engine
 * Configuration & Utilities
 * 
 * Batch Identifier: campusloop-seed-2026-09
 */

export const BATCH_ID = "campusloop-seed-2026-09";
export const ID_PREFIX = "seed_202609_";

/**
 * Realistic posting time slots (hours and minutes)
 * Emulating genuine student activity patterns:
 * - Early morning commuters (06:45, 07:20)
 * - Heading to 8 AM class (08:10)
 * - Mid-lecture boredom / breaks (09:35, 10:15, 11:47)
 * - Lunch canteen chatter (12:30, 13:05)
 * - Afternoon lab lethargy (14:40, 15:55)
 * - Post-class sports & library (16:30, 17:18)
 * - Evening snacks & club meets (18:42, 19:15)
 * - Dinner & casual hostel lounge (20:07, 21:33)
 * - Peak late-night coding & existential chatter (22:11, 23:48, 00:26, 01:15, 02:40)
 */
export const POSTING_TIME_SLOTS = [
  { hour: 6, min: 45 },
  { hour: 7, min: 20 },
  { hour: 8, min: 10 },
  { hour: 9, min: 35 },
  { hour: 10, min: 15 },
  { hour: 11, min: 47 },
  { hour: 12, min: 30 },
  { hour: 13, min: 5 },
  { hour: 14, min: 40 },
  { hour: 15, min: 55 },
  { hour: 16, min: 30 },
  { hour: 17, min: 18 },
  { hour: 18, min: 42 },
  { hour: 19, min: 15 },
  { hour: 20, min: 7 },
  { hour: 21, min: 33 },
  { hour: 22, min: 11 },
  { hour: 23, min: 48 },
  { hour: 0, min: 26 },
  { hour: 1, min: 15 },
  { hour: 2, min: 40 },
];

/**
 * Generates a deterministic date spread over the past 90 days.
 * Includes natural clustering:
 * - Weekday afternoon/night spikes
 * - Weekend hackathon/sports spikes
 * - Mid-sem exam crunch periods
 * - Very recent posts (last 1-48 hours)
 */
export function getStaggeredDate(index: number, total: number, options?: { isRecent?: boolean; daysAgo?: number }): Date {
  const now = new Date("2026-09-25T13:30:00.000Z");

  if (options?.isRecent) {
    // Spread across the last 36 hours
    const minutesAgo = Math.floor((index / total) * 36 * 60) + 12;
    return new Date(now.getTime() - minutesAgo * 60 * 1000);
  }

  if (options?.daysAgo !== undefined) {
    const slot = POSTING_TIME_SLOTS[index % POSTING_TIME_SLOTS.length];
    const targetDate = new Date(now.getTime() - options.daysAgo * 24 * 60 * 60 * 1000);
    targetDate.setUTCHours(slot.hour, slot.min, (index * 17) % 60);
    return targetDate;
  }

  // Non-linear historical distribution: 90 days range
  // More activity in the last 30 days (start of semester + placement season)
  const normalized = index / total;
  // Quadratic weighting towards recent dates
  const daysAgo = Math.floor(Math.pow(1 - normalized, 1.6) * 88);
  const slot = POSTING_TIME_SLOTS[(index * 7) % POSTING_TIME_SLOTS.length];

  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  targetDate.setUTCHours(slot.hour, slot.min, (index * 23) % 60);
  return targetDate;
}

export const KNOWN_INSTITUTIONS: Record<string, string> = {
  bitmesra: "inst_35df75700bb23dd30311ef5f",
  iitd: "inst_eb557a3411799af2cfa39a7d",
  iitb: "inst_594f59cf31f1619b6bbb2cab",
  iitbhu: "inst_3a6038ca7f6df92499e86671",
  iitg: "inst_113360ba354a4ebd9cb2490d",
  iitgn: "inst_350001b58916dd63843af94c",
  iiitd: "inst_c2a8091ca402f554a55852eb",
  dtu: "inst_260dc7fc610dda516b5d8868",
  igdtuw: "inst_41b484b83afe03f6db921d11",
  jadavpur: "inst_be327bdc64225a777514d665",
  manipal: "inst_880023170f1ac518b8429a82",
  annauniv: "inst_ebe9f6a184030a45b9cf0f21",
  nitp: "inst_c56622c9d07f05cdfd78256b",
  nitrr: "inst_5fa91a9c81350c3cea2beac6",
  vitap: "inst_a1232ae02d9592f16c05c4bb",
  nitdelhi: "inst_88f5930cbec3795108057e18",
  iiitp: "inst_3ecbac49723000f6219b5223",
  iiitn: "inst_971a7fb1696a1f77d6f14da6",
  bhu: "inst_c7e5ffdec1e5113f154a5c09",
  nludelhi: "inst_86d85a7f39061ebb98e441f9",
};

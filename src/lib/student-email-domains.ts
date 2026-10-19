/**
 * Verified student email domain mapping & subdomain resolution utilities for CampusLoop.
 * 
 * Many institutions in India provide students with email addresses on different subdomains
 * (e.g. @kgpian.iitkgp.ac.in, @smail.iitm.ac.in, @students.iiit.ac.in) or completely different
 * domains (e.g. @vitstudent.ac.in vs vit.ac.in, @learner.manipal.edu vs manipal.edu, @pec.edu.in vs pec.ac.in).
 */

export const PUBLIC_SUFFIXES = new Set([
  "ac.in",
  "edu.in",
  "gov.in",
  "nic.in",
  "res.in",
  "ernet.in",
  "edu",
  "ac",
  "in",
  "com",
  "org",
  "net",
  "co.in",
  "org.in",
  "net.in",
]);

/**
 * Extracts possible parent domains for a given subdomain.
 * E.g., "kgpian.iitkgp.ac.in" -> ["iitkgp.ac.in"]
 *       "rollno.cse.iitb.ac.in" -> ["cse.iitb.ac.in", "iitb.ac.in"]
 *       "pilani.bits-pilani.ac.in" -> ["bits-pilani.ac.in"]
 */
export function getCandidateParentDomains(domain: string): string[] {
  const clean = (domain || "").trim().toLowerCase().replace(/^@/, "");
  if (!clean || !clean.includes(".")) return [];

  const parts = clean.split(".");
  const candidates: string[] = [];

  // Generate parent subdomains: for "a.b.c.d", candidates are "b.c.d", "c.d"
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (!PUBLIC_SUFFIXES.has(candidate) && candidate.includes(".")) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * Curated, verified student email domains mapped by institution slug.
 */
export const VERIFIED_STUDENT_EMAIL_DOMAINS: Record<string, string[]> = {
  // IITs
  iitkgp: ["kgpian.iitkgp.ac.in", "iitkgp.ac.in", "alumni.iitkgp.ac.in"],
  iitm: ["smail.iitm.ac.in", "iitm.ac.in", "alumni.iitm.ac.in"],
  iitb: ["iitb.ac.in", "iitbombay.org"],
  iitd: ["iitd.ac.in"],
  iitr: ["iitr.ac.in"],
  iitk: ["iitk.ac.in"],
  iitg: ["iitg.ac.in"],
  iitbhu: ["iitbhu.ac.in", "itbhu.ac.in"],
  iith: ["iith.ac.in"],
  iiti: ["iiti.ac.in"],
  iitism: ["iitism.ac.in"],
  iitrpr: ["iitrpr.ac.in"],
  iitj: ["iitj.ac.in"],
  iitgn: ["iitgn.ac.in"],
  iitp: ["iitp.ac.in"],
  iitbbs: ["iitbbs.ac.in"],
  iitmandi: ["students.iitmandi.ac.in", "iitmandi.ac.in"],
  iittp: ["iittp.ac.in"],
  iitpkd: ["iitpkd.ac.in"],
  iitjammu: ["iitjammu.ac.in"],
  iitdh: ["iitdh.ac.in"],
  iitbhilai: ["iitbhilai.ac.in"],
  iitgoa: ["iitgoa.ac.in"],

  // VIT
  vit: ["vitstudent.ac.in", "vit.ac.in"],
  vitap: ["vitapstudent.ac.in", "vitap.ac.in"],
  vitbhopal: ["vitbhopal.ac.in"],
  vitchennai: ["vitstudent.ac.in", "chennai.vit.ac.in"],

  // Manipal
  manipal: ["learner.manipal.edu", "manipal.edu"],
  jaipur: ["jaipur.manipal.edu", "muj.manipal.edu", "learner.manipal.edu"],
  smu: ["smu.edu.in"],

  // BITS Pilani
  bitspilani: [
    "pilani.bits-pilani.ac.in",
    "goa.bits-pilani.ac.in",
    "hyderabad.bits-pilani.ac.in",
    "dubai.bits-pilani.ac.in",
    "bits-pilani.ac.in",
  ],
  bitsgoa: ["goa.bits-pilani.ac.in", "bits-pilani.ac.in"],
  bitshyderabad: ["hyderabad.bits-pilani.ac.in", "bits-pilani.ac.in"],

  // IIITs
  iiit: ["students.iiit.ac.in", "research.iiit.ac.in", "iiit.ac.in", "alumni.iiit.ac.in"],
  iiitb: ["iiitb.ac.in", "iiitb.org"],
  iiitd: ["iiitd.ac.in"],
  iiita: ["iiita.ac.in"],
  iiitl: ["iiitl.ac.in"],
  iiitp: ["iiitp.ac.in"],
  iiits: ["iiits.in"],
  iiitsurat: ["iiitsurat.ac.in"],
  iiitvadodara: ["iiitvadodara.ac.in"],
  iiitg: ["iiitg.ac.in"],
  iiitdm: ["iiitdm.ac.in"],
  iiitdmj: ["iiitdmj.ac.in"],
  iiitm: ["iiitm.ac.in"],
  iiitkottayam: ["iiitkottayam.ac.in"],
  iiitdwd: ["iiitdwd.ac.in"],
  iiitn: ["iiitn.ac.in"],
  iiitbh: ["iiitbh.ac.in"],
  iiitranchi: ["iiitranchi.ac.in"],
  iiitsonepat: ["iiitsonepat.ac.in"],
  iiitu: ["iiitu.ac.in"],
  iiitkalyani: ["iiitkalyani.ac.in"],
  iiitkota: ["iiitkota.ac.in"],
  iiitt: ["iiitt.ac.in"],
  iiitbhopal: ["iiitbhopal.ac.in"],
  iiitagartala: ["iiitagartala.ac.in"],
  iiitr: ["iiitr.ac.in"],

  // NITs
  nitt: ["nitt.edu"],
  nitk: ["nitk.edu.in", "nitk.ac.in"],
  nitw: ["student.nitw.ac.in", "nitw.ac.in"],
  vnit: ["students.vnit.ac.in", "vnit.ac.in"],
  nitrkl: ["nitrkl.ac.in"],
  nitc: ["nitc.ac.in"],
  mnnit: ["mnnit.ac.in"],
  mnit: ["mnit.ac.in"],
  manit: ["manit.ac.in"],
  nitkkr: ["nitkkr.ac.in"],
  nitdgp: ["nitdgp.ac.in"],
  nits: ["nits.ac.in"],
  nitjsr: ["nitjsr.ac.in"],
  nitp: ["nitp.ac.in"],
  nitrr: ["nitrr.ac.in"],
  nith: ["nith.ac.in"],
  nitj: ["nitj.ac.in"],
  nitsri: ["nitsri.net", "nitsri.ac.in"],
  nitgoa: ["nitgoa.ac.in"],
  nitdelhi: ["nitdelhi.ac.in"],
  nitpy: ["nitpy.ac.in"],
  nitm: ["nitm.ac.in"],
  nitnagaland: ["nitnagaland.ac.in"],
  nitmz: ["nitmz.ac.in"],
  nitmanipur: ["nitmanipur.ac.in"],
  nitap: ["nitap.ac.in"],
  nitsikkim: ["nitsikkim.ac.in"],
  nituk: ["nituk.ac.in"],
  nitandhra: ["student.nitandhra.ac.in", "nitandhra.ac.in"],
  svnit: ["svnit.ac.in"],

  // Top Universities, Autonomous Tech & Premier Colleges
  amity: ["s.amity.edu", "amity.edu"],
  pec: ["pec.edu.in", "pec.ac.in"],
  pes: ["pesu.pes.edu", "pes.edu"],
  coep: ["coep.ac.in", "coeptech.ac.in", "coep.org.in"],
  psgtech: ["psgtech.ac.in", "psgtech.edu"],
  sastra: ["sastra.ac.in", "sastra.edu"],
  nmims: ["nmims.edu.in", "nmims.edu"],
  iimcal: ["email.iimcal.ac.in", "iimcal.ac.in"],
  thapar: ["thapar.edu"],
  dtu: ["dtu.ac.in"],
  nsut: ["nsut.ac.in"],
  igdtuw: ["igdtuw.ac.in"],
  ashoka: ["ashoka.edu.in"],
  snu: ["snu.edu.in"],
  plaksha: ["plaksha.edu.in"],
  krea: ["krea.edu.in"],
  flame: ["flame.edu.in"],
  jgu: ["jgu.edu.in"],
  cuchd: ["cuchd.in"],
  lpu: ["lpu.in"],
  kiit: ["kiit.ac.in"],
  soa: ["soa.ac.in"],
  srmist: ["srmist.edu.in"],
  ssn: ["ssn.edu.in"],
  rvce: ["rvce.edu.in"],
  bmsce: ["bmsce.ac.in"],
  msrit: ["msrit.edu"],
  vjti: ["vjti.ac.in"],
  cbit: ["cbit.ac.in"],
  vnrvjiet: ["vnrvjiet.in", "vnrvjiet.ac.in"],
  vce: ["vce.ac.in"],
  ststephens: ["ststephens.edu", "stephens.edu"],
  srcc: ["srcc.edu", "srcc.du.ac.in"],
  hinducollege: ["hinducollege.ac.in", "hinducollege.du.ac.in"],
  mirandahouse: ["mirandahouse.ac.in"],
  hansrajcollege: ["hansrajcollege.ac.in"],
  lsr: ["lsr.edu.in"],
  loyolacollege: ["loyolacollege.edu"],
  xaviersmumbai: ["xaviers.edu", "student.xaviers.edu"],
  xavierskolkata: ["sxccal.edu"],
  bitsindri: ["bitsindri.ac.in"],
  spit: ["spit.ac.in"],
  aitpune: ["aitpune.edu.in"],
  walchand: ["walchandsangli.ac.in"],
  heritageit: ["heritageit.edu"],
  iem: ["iem.edu.in"],
  akgec: ["akgec.ac.in"],
  kiet: ["kiet.edu"],
  glbitm: ["glbitm.org"],
  jssaten: ["jssaten.ac.in"],
  cmcvellore: ["cmcvellore.ac.in", "cmch-vellore.edu"],
  hbtu: ["hbtu.ac.in"],
  mmmut: ["mmmut.ac.in"],
  christuniversity: ["christuniversity.in", "res.christuniversity.in"],
  siu: ["siu.edu.in", "sitpune.edu.in", "scit.edu", "sibmbengaluru.edu.in", "sibm.edu"],
  iisc: ["iisc.ac.in"],
  nls: ["nls.ac.in"],
  du: ["du.ac.in", "admin.du.ac.in"],
  jnu: ["jnu.ac.in"],
  jmi: ["jmi.ac.in"],
  iiests: ["iiests.ac.in"],
  jiit: ["jiit.ac.in"],
  bennett: ["bennett.edu.in"],
  upes: ["upes.ac.in"],
  geu: ["geu.ac.in"],
  galgotiasuniversity: ["galgotiasuniversity.edu.in"],
  somaiya: ["somaiya.edu"],
  chitkara: ["chitkara.edu.in"],
};

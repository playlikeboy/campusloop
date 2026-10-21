/**
 * Verified student email domain mapping & subdomain resolution utilities for CampusLoop.
 * 
 * Many institutions in India provide students with email addresses on different subdomains
 * (e.g. @kgpian.iitkgp.ac.in, @smail.iitm.ac.in, @students.iiit.ac.in, @students.vnit.ac.in)
 * or completely different domains/portals:
 *   - AMU: @myamu.ac.in vs website amu.ac.in
 *   - Chandigarh University: @cumail.in vs website cuchd.in
 *   - UPES: @stu.upes.ac.in vs website upes.ac.in
 *   - VIT: @vitstudent.ac.in vs website vit.ac.in
 *   - Manipal: @learner.manipal.edu vs website manipal.edu
 *   - PEC Chandigarh: @pec.edu.in vs website pec.ac.in
 *   - Amrita: @students.amrita.edu vs website amrita.edu
 *   - Anna University: @ceg.annauniv.edu, @mitindia.edu vs website annauniv.edu
 *   - Jadavpur University: @jdvu.ac.in vs website jadavpuruniversity.in
 *   - BITS Pilani: @pilani.bits-pilani.ac.in, @goa.bits-pilani.ac.in, @hyderabad.bits-pilani.ac.in
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
  // IITs (23 Indian Institutes of Technology)
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

  // VIT Campuses
  vit: ["vitstudent.ac.in", "vit.ac.in"],
  vitap: ["vitapstudent.ac.in", "vitap.ac.in"],
  vitbhopal: ["vitbhopal.ac.in"],
  vitchennai: ["vitstudent.ac.in", "chennai.vit.ac.in"],

  // Manipal Campuses
  manipal: ["learner.manipal.edu", "manipal.edu"],
  jaipur: ["jaipur.manipal.edu", "muj.manipal.edu", "learner.manipal.edu"],
  smu: ["smu.edu.in"],

  // BITS Pilani Campuses
  bitspilani: [
    "pilani.bits-pilani.ac.in",
    "goa.bits-pilani.ac.in",
    "hyderabad.bits-pilani.ac.in",
    "dubai.bits-pilani.ac.in",
    "bits-pilani.ac.in",
  ],
  bitsgoa: ["goa.bits-pilani.ac.in", "bits-pilani.ac.in"],
  bitshyderabad: ["hyderabad.bits-pilani.ac.in", "bits-pilani.ac.in"],

  // IIITs (Indian Institutes of Information Technology)
  iiit: ["students.iiit.ac.in", "research.iiit.ac.in", "iiit.ac.in", "alumni.iiit.ac.in"],
  iiitb: ["iiitb.ac.in", "iiitb.org"],
  iiitd: ["iiitd.ac.in"],
  iiita: ["iiita.ac.in"],
  iiitl: ["iiitl.ac.in"],
  iiitp: ["iiitp.ac.in"],
  iiits: ["iiits.in", "iiits.ac.in"],
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
  iiitbh1: ["iiit-bh.ac.in", "iiitbh.ac.in"],

  // NITs (National Institutes of Technology)
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
  iiests: ["iiests.ac.in"],

  // IIMs (Indian Institutes of Management)
  iima: ["iima.ac.in", "pgp.iima.ac.in"],
  iimb: ["iimb.ac.in"],
  iimcal: ["email.iimcal.ac.in", "iimcal.ac.in"],
  iiml: ["iiml.ac.in", "iiml.org"],
  iimk: ["iimk.ac.in", "iimk.edu.in"],
  iimidr: ["iimidr.ac.in"],
  iimkashipur: ["iimkashipur.ac.in"],
  iimbg: ["iimbg.ac.in"],
  iimamritsar: ["iimamritsar.ac.in"],

  // NLUs (National Law Universities)
  nls: ["nls.ac.in"],
  nalsar: ["nalsar.ac.in"],
  nujs: ["nujs.edu"],
  nludelhi: ["nludelhi.ac.in"],
  gnlu: ["gnlu.ac.in"],
  nlujodhpur: ["nlujodhpur.ac.in"],
  nliu: ["nliu.ac.in"],
  rgnul: ["rgnul.ac.in"],
  nluo: ["nluo.ac.in"],
  hnlu: ["hnlu.ac.in"],
  cnlu: ["cnlu.ac.in"],
  dsnlu: ["dsnlu.ac.in"],
  nluassam: ["nluassam.ac.in"],
  tnnlu: ["tnnlu.ac.in"],
  mnlumumbai: ["mnlumumbai.edu.in"],
  nlunagpur: ["nlunagpur.ac.in"],
  mnlua: ["mnlua.ac.in"],

  // Central & State Universities with distinct student email formats
  amu: ["myamu.ac.in", "amu.ac.in"],
  cuchd: ["cumail.in", "cuchd.in"],
  upes: ["stu.upes.ac.in", "upes.ac.in"],
  amrita: [
    "students.amrita.edu",
    "cb.students.amrita.edu",
    "am.students.amrita.edu",
    "blr.students.amrita.edu",
    "cb.amrita.edu",
    "amrita.edu",
  ],
  annauniv: [
    "annauniv.edu",
    "ceg.annauniv.edu",
    "mitindia.edu",
    "act.annauniv.edu",
    "auegov.ac.in",
  ],
  jadavpuruniversity: ["jdvu.ac.in", "jadavpuruniversity.in"],
  uohyd: ["uohyd.ac.in", "uohyd.ernet.in"],
  pdpu: ["pdeu.ac.in", "pdpu.ac.in"],
  srmist: ["srmist.edu.in", "srmuniv.ac.in"],
  srmap: ["srmap.edu.in"],
  lpu: ["lpu.in", "lpu.co.in"],
  du: ["du.ac.in", "admin.du.ac.in", "fms.edu", "cic.du.ac.in"],
  jnu: ["jnu.ac.in"],
  jmi: ["jmi.ac.in"],
  bhu: ["bhu.ac.in"],
  iisc: ["iisc.ac.in"],
  cusat: ["cusat.ac.in"],
  vssut: ["vssut.ac.in"],
  bitmesra: ["bitmesra.ac.in"],
  ictmumbai: ["ictmumbai.edu.in"],
  ddu: ["ddu.ac.in"],

  // Medical Institutions
  pgimer: ["pgimer.edu.in"],
  jipmer: ["jipmer.edu.in"],
  kgmu: ["kgmu.org"],
  cmcvellore: ["cmcvellore.ac.in", "cmch-vellore.edu"],
  aiimsbhubaneswar: ["aiimsbhubaneswar.edu.in"],
  aiimsbibinagar: ["aiimsbibinagar.edu.in"],
  aiimsmangalagiri: ["aiimsmangalagiri.edu.in"],
  mamc: ["mamc.ac.in"],
  vmmc: ["vmmc-sjh.nic.in"],
  bmcri: ["bmcri.edu.in"],
  kem: ["kem.edu"],

  // Top Private & Autonomous Tech Universities
  amity: ["s.amity.edu", "amity.edu"],
  pec: ["pec.edu.in", "pec.ac.in"],
  pes: ["pesu.pes.edu", "pes.edu"],
  coep: ["coep.ac.in", "coeptech.ac.in", "coep.org.in"],
  psgtech: ["psgtech.ac.in", "psgtech.edu"],
  sastra: ["sastra.ac.in", "sastra.edu"],
  nmims: ["nmims.edu.in", "nmims.edu"],
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
  kiit: ["kiit.ac.in"],
  soa: ["soa.ac.in"],
  ssn: ["ssn.edu.in"],
  daiict: ["daiict.ac.in"],
  lnmiit: ["lnmiit.ac.in"],
  jiit: ["jiit.ac.in"],
  bennett: ["bennett.edu.in"],
  geu: ["geu.ac.in"],
  galgotiasuniversity: ["galgotiasuniversity.edu.in"],
  somaiya: ["somaiya.edu"],
  chitkara: ["chitkara.edu.in"],
  christuniversity: ["christuniversity.in", "res.christuniversity.in"],
  siu: ["siu.edu.in", "sitpune.edu.in", "scit.edu", "sibmbengaluru.edu.in", "sibm.edu"],
  mitwpu: ["mitwpu.edu.in"],
  woxsen: ["woxsen.edu.in"],
  mahindrauniversity: ["mahindrauniversity.edu.in"],
  hbtu: ["hbtu.ac.in"],
  mmmut: ["mmmut.ac.in"],

  // Top Autonomous Engineering Colleges across Maharashtra, Karnataka, Telangana, Delhi, Tamil Nadu, Kerala, Gujarat, UP, West Bengal
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
  glbitm: ["glbitm.org", "glbitm.ac.in"],
  jssaten: ["jssaten.ac.in"],

  // New Autonomous & Premier Additions
  pict: ["pict.edu"],
  vitpune: ["vit.edu", "learner.vierp.in"],
  pccoe: ["pccoepune.org"],
  cumminscollege: ["cumminscollege.in"],
  djsce: ["djsce.ac.in"],
  tsec: ["tsec.edu"],
  frcrce: ["frcrce.ac.in"],
  dsce: ["dsce.edu.in", "dayanandasagar.edu"],
  bmsit: ["bmsit.in"],
  bitbangalore: ["bit-bangalore.edu.in"],
  sirmvit: ["sirmvit.edu"],
  nhce: ["newhorizonindia.edu"],
  nmit: ["nmit.ac.in"],
  cmrit: ["cmrit.ac.in"],
  sittumkur: ["sit.ac.in"],
  nie: ["nie.ac.in"],
  rvitm: ["rvitm.edu.in"],
  griet: ["griet.ac.in"],
  kmit: ["kmit.in"],
  cvr: ["cvr.ac.in"],
  vardhaman: ["vardhaman.org"],
  bvrit: ["bvrit.ac.in"],
  gnits: ["gnits.ac.in"],
  mait: ["mait.ac.in"],
  msit: ["msit.in", "msit.edu.in"],
  bvcoend: ["bvcoend.ac.in", "bharatividyapeeth.edu"],
  sscbs: ["sscbs.du.ac.in"],
  kmc: ["kmc.du.ac.in"],
  ramjas: ["ramjas.du.ac.in"],
  svc: ["svc.ac.in", "svc.du.ac.in"],
  fms: ["fms.edu"],
  citcoimbatore: ["cit.edu.in"],
  kct: ["kct.ac.in", "kumaraguru.edu.in"],
  tce: ["tce.edu"],
  svce: ["svce.ac.in"],
  rajalakshmi: ["rajalakshmi.edu.in"],
  bitsathy: ["bitsathy.ac.in"],
  kongu: ["kongu.ac.in", "kongu.edu"],
  gct: ["gct.ac.in"],
  cet: ["cet.ac.in"],
  mec: ["mec.ac.in"],
  gectcr: ["gectcr.ac.in"],
  tkmce: ["tkmce.ac.in"],
  rajagiri: ["rajagiritech.edu.in"],
  fisat: ["fisat.ac.in"],
  mbcet: ["mbcet.ac.in"],
  scms: ["scmsgroup.org"],
  abes: ["abes.ac.in"],
  gcet: ["galgotiacollege.edu"],
  tmsl: ["ticollege.ac.in"],
  kgec: ["kgec.edu.in"],
  hithaldia: ["hithaldia.ac.in", "hithaldia.in"],
  bvm: ["bvmengineering.ac.in"],
  ldce: ["ldce.ac.in"],
  vgec: ["vgecg.ac.in"],
};

/**
 * Reverse lookup map from verified student email domain to institution slug.
 * Allows instant, zero-latency resolution of student email domains.
 */
export const DOMAIN_TO_SLUG_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [slug, domains] of Object.entries(VERIFIED_STUDENT_EMAIL_DOMAINS)) {
    for (const d of domains) {
      const clean = d.trim().toLowerCase().replace(/^@/, "");
      if (clean && !map[clean]) {
        map[clean] = slug;
      }
    }
  }
  return map;
})();

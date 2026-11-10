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
  iitkgp: [
    "kgpian.iitkgp.ac.in",
    "cse.iitkgp.ac.in",
    "ece.iitkgp.ac.in",
    "ee.iitkgp.ac.in",
    "mech.iitkgp.ac.in",
    "civil.iitkgp.ac.in",
    "che.iitkgp.ac.in",
    "aero.iitkgp.ac.in",
    "min.iitkgp.ac.in",
    "ocean.iitkgp.ac.in",
    "maths.iitkgp.ac.in",
    "phy.iitkgp.ac.in",
    "chem.iitkgp.ac.in",
    "biotech.iitkgp.ac.in",
    "vgsom.iitkgp.ac.in",
    "rgsoipl.iitkgp.ac.in",
    "alumni.iitkgp.ac.in",
    "iitkgp.ac.in",
  ],
  iitm: [
    "smail.iitm.ac.in",
    "cse.iitm.ac.in",
    "ee.iitm.ac.in",
    "mech.iitm.ac.in",
    "ae.iitm.ac.in",
    "ce.iitm.ac.in",
    "ch.iitm.ac.in",
    "ed.iitm.ac.in",
    "mme.iitm.ac.in",
    "oe.iitm.ac.in",
    "bt.iitm.ac.in",
    "physics.iitm.ac.in",
    "chem.iitm.ac.in",
    "math.iitm.ac.in",
    "doms.iitm.ac.in",
    "alumni.iitm.ac.in",
    "iitm.ac.in",
  ],
  iitb: [
    "cse.iitb.ac.in",
    "ee.iitb.ac.in",
    "me.iitb.ac.in",
    "mech.iitb.ac.in",
    "aero.iitb.ac.in",
    "che.iitb.ac.in",
    "civil.iitb.ac.in",
    "mems.iitb.ac.in",
    "ieor.iitb.ac.in",
    "energy.iitb.ac.in",
    "env.iitb.ac.in",
    "math.iitb.ac.in",
    "phy.iitb.ac.in",
    "chem.iitb.ac.in",
    "sjmsom.iitb.ac.in",
    "idc.iitb.ac.in",
    "iitbombay.org",
    "iitb.ac.in",
  ],
  iitd: [
    "cse.iitd.ac.in",
    "ee.iitd.ac.in",
    "mech.iitd.ac.in",
    "civil.iitd.ac.in",
    "chemical.iitd.ac.in",
    "am.iitd.ac.in",
    "maths.iitd.ac.in",
    "physics.iitd.ac.in",
    "chemistry.iitd.ac.in",
    "textile.iitd.ac.in",
    "dms.iitd.ac.in",
    "des.iitd.ac.in",
    "care.iitd.ac.in",
    "iitd.ac.in",
  ],
  iitr: [
    "cs.iitr.ac.in",
    "ece.iitr.ac.in",
    "ee.iitr.ac.in",
    "me.iitr.ac.in",
    "ce.iitr.ac.in",
    "ch.iitr.ac.in",
    "meta.iitr.ac.in",
    "ar.iitr.ac.in",
    "bt.iitr.ac.in",
    "earth.iitr.ac.in",
    "maths.iitr.ac.in",
    "ph.iitr.ac.in",
    "cy.iitr.ac.in",
    "doms.iitr.ac.in",
    "iitr.ac.in",
  ],
  iitk: [
    "cse.iitk.ac.in",
    "ee.iitk.ac.in",
    "me.iitk.ac.in",
    "ce.iitk.ac.in",
    "che.iitk.ac.in",
    "ae.iitk.ac.in",
    "mse.iitk.ac.in",
    "mth.iitk.ac.in",
    "phy.iitk.ac.in",
    "chm.iitk.ac.in",
    "ime.iitk.ac.in",
    "bsbe.iitk.ac.in",
    "eco.iitk.ac.in",
    "iitk.ac.in",
  ],
  iitg: [
    "cse.iitg.ac.in",
    "ece.iitg.ac.in",
    "eee.iitg.ac.in",
    "mech.iitg.ac.in",
    "civil.iitg.ac.in",
    "chemeng.iitg.ac.in",
    "design.iitg.ac.in",
    "maths.iitg.ac.in",
    "physics.iitg.ac.in",
    "chemistry.iitg.ac.in",
    "iitg.ac.in",
  ],
  iitbhu: [
    "itbhu.ac.in",
    "cse.iitbhu.ac.in",
    "ece.iitbhu.ac.in",
    "eee.iitbhu.ac.in",
    "mec.iitbhu.ac.in",
    "civ.iitbhu.ac.in",
    "che.iitbhu.ac.in",
    "met.iitbhu.ac.in",
    "min.iitbhu.ac.in",
    "cer.iitbhu.ac.in",
    "iitbhu.ac.in",
  ],
  iith: ["iith.ac.in"],
  iiti: ["iiti.ac.in"],
  iitism: [
    "cse.iitism.ac.in",
    "mech.iitism.ac.in",
    "me.iitism.ac.in",
    "cve.iitism.ac.in",
    "ce.iitism.ac.in",
    "ece.iitism.ac.in",
    "ec.iitism.ac.in",
    "ee.iitism.ac.in",
    "pe.iitism.ac.in",
    "mme.iitism.ac.in",
    "mn.iitism.ac.in",
    "mne.iitism.ac.in",
    "mining.iitism.ac.in",
    "che.iitism.ac.in",
    "ch.iitism.ac.in",
    "am.iitism.ac.in",
    "mc.iitism.ac.in",
    "maths.iitism.ac.in",
    "ag.iitism.ac.in",
    "gl.iitism.ac.in",
    "apg.iitism.ac.in",
    "gp.iitism.ac.in",
    "agp.iitism.ac.in",
    "ap.iitism.ac.in",
    "ph.iitism.ac.in",
    "ac.iitism.ac.in",
    "cy.iitism.ac.in",
    "es.iitism.ac.in",
    "ese.iitism.ac.in",
    "env.iitism.ac.in",
    "fm.iitism.ac.in",
    "fme.iitism.ac.in",
    "ms.iitism.ac.in",
    "dms.iitism.ac.in",
    "hs.iitism.ac.in",
    "hss.iitism.ac.in",
    "student.iitism.ac.in",
    "alumni.iitism.ac.in",
    "iitism.ac.in",
  ],
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

/**
 * Detailed official student email format metadata across Indian colleges.
 * Provides format template, live example, ID type, and department branch subdomains.
 */
export interface InstitutionEmailFormat {
  pattern: string;
  example: string;
  idType: string;
  description: string;
  departmentSubdomains?: string[];
}

export const INSTITUTION_EMAIL_FORMATS: Record<string, InstitutionEmailFormat> = {
  iitism: {
    pattern: "<admission_number>@<branch>.iitism.ac.in",
    example: "20je0221@cse.iitism.ac.in",
    idType: "Admission Number / Roll Number",
    description:
      "IIT (ISM) Dhanbad assigns student email addresses using admission number (e.g. 20je0221) combined with the department branch code (cse, mech, cve, ece, pe, ee, mme, etc.) or the institute domain @iitism.ac.in.",
    departmentSubdomains: [
      "cse",
      "mech",
      "me",
      "cve",
      "ce",
      "ece",
      "ec",
      "ee",
      "pe",
      "mme",
      "mn",
      "mne",
      "mining",
      "che",
      "ch",
      "am",
      "mc",
      "maths",
      "ag",
      "gl",
      "apg",
      "gp",
      "agp",
      "ap",
      "ph",
      "ac",
      "cy",
      "es",
      "ese",
      "env",
      "fm",
      "fme",
      "ms",
      "dms",
      "hs",
      "hss",
    ],
  },
  iitkgp: {
    pattern: "<rollno>@kgpian.iitkgp.ac.in",
    example: "20CS10001@kgpian.iitkgp.ac.in",
    idType: "Roll Number",
    description:
      "IIT Kharagpur students use the official @kgpian.iitkgp.ac.in student webmail or department-specific subdomains.",
    departmentSubdomains: [
      "cse",
      "ece",
      "ee",
      "mech",
      "civil",
      "che",
      "aero",
      "min",
      "ocean",
      "maths",
      "phy",
      "chem",
      "biotech",
      "vgsom",
    ],
  },
  iitm: {
    pattern: "<rollno>@smail.iitm.ac.in",
    example: "cs20b001@smail.iitm.ac.in",
    idType: "Roll Number",
    description:
      "IIT Madras provides student webmail on @smail.iitm.ac.in for undergraduate and graduate scholars.",
    departmentSubdomains: [
      "cse",
      "ee",
      "mech",
      "ae",
      "ce",
      "ch",
      "ed",
      "mme",
      "oe",
      "bt",
      "physics",
      "chem",
      "math",
      "doms",
    ],
  },
  iitb: {
    pattern: "<rollno>@iitb.ac.in",
    example: "200050001@iitb.ac.in",
    idType: "Roll Number / LDAP ID",
    description:
      "IIT Bombay assigns an institute LDAP username and student roll number email on @iitb.ac.in or department subdomains.",
    departmentSubdomains: [
      "cse",
      "ee",
      "me",
      "mech",
      "aero",
      "che",
      "civil",
      "mems",
      "ieor",
      "energy",
      "env",
      "math",
      "phy",
      "chem",
      "sjmsom",
      "idc",
    ],
  },
  iitd: {
    pattern: "<entry_no>@<dept>.iitd.ac.in",
    example: "2020cs10321@cse.iitd.ac.in",
    idType: "Entry Number / Kerberos ID",
    description:
      "IIT Delhi allocates student accounts combining entry number with department subdomains or Kerberos username.",
    departmentSubdomains: [
      "cse",
      "ee",
      "mech",
      "civil",
      "chemical",
      "am",
      "maths",
      "physics",
      "chemistry",
      "textile",
      "dms",
      "des",
      "care",
    ],
  },
  iitr: {
    pattern: "<firstname>_<firstinitial>@<branch>.iitr.ac.in",
    example: "rahul_v@cs.iitr.ac.in",
    idType: "Student Enrollment ID",
    description:
      "IIT Roorkee uses branch-based subdomains such as @cs.iitr.ac.in, @ece.iitr.ac.in, and @me.iitr.ac.in.",
    departmentSubdomains: [
      "cs",
      "ece",
      "ee",
      "me",
      "ce",
      "ch",
      "meta",
      "ar",
      "bt",
      "earth",
      "maths",
      "ph",
      "cy",
      "doms",
    ],
  },
  iitk: {
    pattern: "<cc_id>@iitk.ac.in",
    example: "rohitk20@iitk.ac.in",
    idType: "CC Username / Roll Number",
    description:
      "IIT Kanpur assigns CC usernames mapped directly to @iitk.ac.in and department subdomains.",
    departmentSubdomains: [
      "cse",
      "ee",
      "me",
      "ce",
      "che",
      "ae",
      "mse",
      "mth",
      "phy",
      "chm",
      "ime",
      "bsbe",
      "eco",
    ],
  },
  iitbhu: {
    pattern: "<name>.<branch><year>@itbhu.ac.in",
    example: "rahul.cse20@itbhu.ac.in",
    idType: "Institute Roll / Branch Code",
    description:
      "IIT (BHU) Varanasi uses official Google Workspace accounts on @itbhu.ac.in and @iitbhu.ac.in.",
    departmentSubdomains: [
      "cse",
      "ece",
      "eee",
      "mec",
      "civ",
      "che",
      "met",
      "min",
      "cer",
    ],
  },
  iitg: {
    pattern: "<webmail_id>@iitg.ac.in",
    example: "r.sharma@iitg.ac.in",
    idType: "Webmail ID / Roll Number",
    description:
      "IIT Guwahati assigns students webmail accounts ending with @iitg.ac.in and department subdomains.",
    departmentSubdomains: [
      "cse",
      "ece",
      "eee",
      "mech",
      "civil",
      "chemeng",
      "design",
      "maths",
      "physics",
      "chemistry",
    ],
  },
  iitmandi: {
    pattern: "<rollno>@students.iitmandi.ac.in",
    example: "b20001@students.iitmandi.ac.in",
    idType: "Roll Number",
    description:
      "IIT Mandi allocates student email addresses on the @students.iitmandi.ac.in portal.",
  },
  bitspilani: {
    pattern: "f<admission_year><id>@<campus>.bits-pilani.ac.in",
    example: "f20200123@pilani.bits-pilani.ac.in",
    idType: "BITS Student ID",
    description:
      "BITS Pilani assigns official accounts based on student ID across Pilani, Goa, and Hyderabad campuses.",
    departmentSubdomains: ["pilani", "goa", "hyderabad", "dubai"],
  },
  bitsgoa: {
    pattern: "f<admission_year><id>@goa.bits-pilani.ac.in",
    example: "f20200123@goa.bits-pilani.ac.in",
    idType: "BITS Student ID",
    description: "BITS Pilani K.K. Birla Goa Campus student email addresses.",
  },
  bitshyderabad: {
    pattern: "f<admission_year><id>@hyderabad.bits-pilani.ac.in",
    example: "f20200123@hyderabad.bits-pilani.ac.in",
    idType: "BITS Student ID",
    description: "BITS Pilani Hyderabad Campus student email addresses.",
  },
  iiit: {
    pattern: "<firstname>.<lastname>@students.iiit.ac.in",
    example: "aarav.sharma@students.iiit.ac.in",
    idType: "Student Portal ID",
    description:
      "IIIT Hyderabad provides student accounts on @students.iiit.ac.in and research scholars on @research.iiit.ac.in.",
  },
  vit: {
    pattern: "<firstname>.<lastname><year>@vitstudent.ac.in",
    example: "rahul.verma2020@vitstudent.ac.in",
    idType: "Registration Number",
    description:
      "Vellore Institute of Technology assigns official @vitstudent.ac.in Google Workspace accounts.",
  },
  vitap: {
    pattern: "<firstname>.<regno>@vitapstudent.ac.in",
    example: "ananya.20bce1001@vitapstudent.ac.in",
    idType: "Registration Number",
    description: "VIT-AP assigns official student emails on @vitapstudent.ac.in.",
  },
  manipal: {
    pattern: "<firstname>.<regno>@learner.manipal.edu",
    example: "aditya.200905001@learner.manipal.edu",
    idType: "Registration Number",
    description:
      "Manipal Academy of Higher Education (MAHE) provides Microsoft 365 student emails on @learner.manipal.edu.",
  },
  nitw: {
    pattern: "<rollno>@student.nitw.ac.in",
    example: "982001@student.nitw.ac.in",
    idType: "Roll Number",
    description: "NIT Warangal provides official student email addresses on @student.nitw.ac.in.",
  },
  vnit: {
    pattern: "<rollno>@students.vnit.ac.in",
    example: "bt20cse042@students.vnit.ac.in",
    idType: "Roll Number",
    description: "VNIT Nagpur provides all students with @students.vnit.ac.in addresses.",
  },
  nitt: {
    pattern: "<rollno>@nitt.edu",
    example: "106120001@nitt.edu",
    idType: "Roll Number",
    description: "NIT Trichy assigns student webmail on the official @nitt.edu domain.",
  },
  nitk: {
    pattern: "<rollno>@nitk.edu.in",
    example: "201co101@nitk.edu.in",
    idType: "Roll Number",
    description: "NIT Surathkal provides student email accounts on @nitk.edu.in.",
  },
  mnnit: {
    pattern: "<regno>@mnnit.ac.in",
    example: "20204001@mnnit.ac.in",
    idType: "Registration Number",
    description: "MNNIT Allahabad assigns student accounts on @mnnit.ac.in.",
  },
  dtu: {
    pattern: "<rollno>_ug_2k<year>@dtu.ac.in",
    example: "2k20_co_101@dtu.ac.in",
    idType: "Roll Number",
    description: "Delhi Technological University allocates official @dtu.ac.in student accounts.",
  },
  nsut: {
    pattern: "<rollno>@nsut.ac.in",
    example: "2020ucse001@nsut.ac.in",
    idType: "Roll Number",
    description: "Netaji Subhas University of Technology provides student accounts on @nsut.ac.in.",
  },
  pec: {
    pattern: "<sid>@pec.edu.in",
    example: "20103001@pec.edu.in",
    idType: "Student ID (SID)",
    description: "Punjab Engineering College assigns official student accounts on @pec.edu.in.",
  },
  coep: {
    pattern: "<mis>@coep.ac.in",
    example: "112003001@coep.ac.in",
    idType: "MIS Number",
    description: "COEP Technological University allocates official @coep.ac.in accounts.",
  },
  cuchd: {
    pattern: "<uid>@cumail.in",
    example: "20bcs1001@cumail.in",
    idType: "UID (University ID)",
    description: "Chandigarh University issues student accounts on the @cumail.in portal.",
  },
  upes: {
    pattern: "<sapid>@stu.upes.ac.in",
    example: "500082341@stu.upes.ac.in",
    idType: "SAP ID",
    description: "UPES Dehradun issues official @stu.upes.ac.in accounts to all enrolled students.",
  },
  amrita: {
    pattern: "<rollno>@students.amrita.edu",
    example: "cb.en.u4cse20001@students.amrita.edu",
    idType: "Roll Number",
    description:
      "Amrita Vishwa Vidyapeetham allocates campus-coded @students.amrita.edu accounts.",
  },
  amu: {
    pattern: "<enrollmentno>@myamu.ac.in",
    example: "gl1234@myamu.ac.in",
    idType: "Enrollment Number",
    description: "Aligarh Muslim University provides students with @myamu.ac.in student accounts.",
  },
  annauniv: {
    pattern: "<regno>@ceg.annauniv.edu",
    example: "2020101001@ceg.annauniv.edu",
    idType: "Register Number",
    description:
      "Anna University campus emails: @ceg.annauniv.edu (CEG), @mitindia.edu (MIT), and @act.annauniv.edu (ACT).",
    departmentSubdomains: ["ceg", "mitindia", "act"],
  },
  jadavpuruniversity: {
    pattern: "<rollno>@jdvu.ac.in",
    example: "002010501001@jdvu.ac.in",
    idType: "Class Roll Number",
    description: "Jadavpur University issues student email addresses on @jdvu.ac.in.",
  },
  srmist: {
    pattern: "<netid>@srmist.edu.in",
    example: "ra2011003010001@srmist.edu.in",
    idType: "Registration Number / NetID",
    description: "SRM Institute of Science and Technology provides accounts on @srmist.edu.in.",
  },
  amity: {
    pattern: "<enrollmentno>@s.amity.edu",
    example: "a2305220001@s.amity.edu",
    idType: "Enrollment Number",
    description: "Amity University students use the official @s.amity.edu domain.",
  },
  pes: {
    pattern: "<srn>@pesu.pes.edu",
    example: "pes1ug20cs001@pesu.pes.edu",
    idType: "Student PRN / SRN",
    description: "PES University issues student accounts on @pesu.pes.edu.",
  },
};

/**
 * Resolves the official student email format given an institution slug or email domain.
 */
export function getInstitutionEmailFormat(slugOrDomain: string): InstitutionEmailFormat | null {
  const clean = (slugOrDomain || "").trim().toLowerCase().replace(/^@/, "");
  if (!clean) return null;

  // 1. Direct match on institution slug
  if (INSTITUTION_EMAIL_FORMATS[clean]) {
    return INSTITUTION_EMAIL_FORMATS[clean];
  }

  // 2. Lookup slug via verified domain registry
  const slugFromDomain = DOMAIN_TO_SLUG_MAP[clean];
  if (slugFromDomain && INSTITUTION_EMAIL_FORMATS[slugFromDomain]) {
    return INSTITUTION_EMAIL_FORMATS[slugFromDomain];
  }

  // 3. Parent domain lookup (e.g. cse.iitism.ac.in -> iitism.ac.in -> iitism)
  const parents = getCandidateParentDomains(clean);
  for (const parent of parents) {
    const parentSlug = DOMAIN_TO_SLUG_MAP[parent];
    if (parentSlug && INSTITUTION_EMAIL_FORMATS[parentSlug]) {
      return INSTITUTION_EMAIL_FORMATS[parentSlug];
    }
  }

  return null;
}

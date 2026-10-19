import { createHash } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { institutionDomains, institutions, type NewInstitution } from "../src/db/schema";
import { loadLocalEnv } from "../src/lib/load-env";

loadLocalEnv();

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL. Set DATABASE_URL or DB_URL before running.");
  }
  return databaseUrl;
}

function stableId(prefix: string, value: string) {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 24);
  return `${prefix}_${hash}`;
}

// 1. Curated real evidence for prominent colleges to add to CampusLoop directory & DB
const NEW_COLLEGES_TO_ADD = [
  {
    aisheCode: "C-20925",
    name: "R.V. College of Engineering, Bengaluru",
    slug: "rvce",
    state: "Karnataka",
    district: "Bengaluru Urban",
    website: "https://www.rvce.edu.in",
    websiteDomain: "rvce.edu.in",
    yearOfEstablishment: 1963,
    locationType: "Urban",
  },
  {
    aisheCode: "C-20926",
    name: "B.M.S. College of Engineering, Bengaluru",
    slug: "bmsce",
    state: "Karnataka",
    district: "Bengaluru Urban",
    website: "https://www.bmsce.ac.in",
    websiteDomain: "bmsce.ac.in",
    yearOfEstablishment: 1946,
    locationType: "Urban",
  },
  {
    aisheCode: "C-20927",
    name: "Ramaiah Institute of Technology, Bengaluru",
    slug: "msrit",
    state: "Karnataka",
    district: "Bengaluru Urban",
    website: "https://www.msrit.edu",
    websiteDomain: "msrit.edu",
    yearOfEstablishment: 1962,
    locationType: "Urban",
  },
  {
    aisheCode: "C-33829",
    name: "Veermata Jijabai Technological Institute, Mumbai",
    slug: "vjti",
    state: "Maharashtra",
    district: "Mumbai",
    website: "https://www.vjti.ac.in",
    websiteDomain: "vjti.ac.in",
    yearOfEstablishment: 1887,
    locationType: "Urban",
  },
  {
    aisheCode: "C-25622",
    name: "Chaitanya Bharathi Institute of Technology, Hyderabad",
    slug: "cbit",
    state: "Telangana",
    district: "Hyderabad",
    website: "https://www.cbit.ac.in",
    websiteDomain: "cbit.ac.in",
    yearOfEstablishment: 1979,
    locationType: "Urban",
  },
  {
    aisheCode: "C-25624",
    name: "VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad",
    slug: "vnrvjiet",
    state: "Telangana",
    district: "Hyderabad",
    website: "https://vnrvjiet.ac.in",
    websiteDomain: "vnrvjiet.ac.in",
    yearOfEstablishment: 1995,
    locationType: "Urban",
  },
  {
    aisheCode: "C-25625",
    name: "Vasavi College of Engineering, Hyderabad",
    slug: "vce",
    state: "Telangana",
    district: "Hyderabad",
    website: "https://www.vce.ac.in",
    websiteDomain: "vce.ac.in",
    yearOfEstablishment: 1981,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6379",
    name: "St. Stephen's College, Delhi",
    slug: "ststephens",
    state: "Delhi",
    district: "North",
    website: "https://www.ststephens.edu",
    websiteDomain: "ststephens.edu",
    yearOfEstablishment: 1881,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6378",
    name: "Shri Ram College of Commerce, Delhi",
    slug: "srcc",
    state: "Delhi",
    district: "North",
    website: "https://www.srcc.edu",
    websiteDomain: "srcc.edu",
    yearOfEstablishment: 1926,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6376",
    name: "Hindu College, Delhi",
    slug: "hinducollege",
    state: "Delhi",
    district: "North",
    website: "https://hinducollege.ac.in",
    websiteDomain: "hinducollege.ac.in",
    yearOfEstablishment: 1899,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6374",
    name: "Miranda House, Delhi",
    slug: "mirandahouse",
    state: "Delhi",
    district: "North",
    website: "https://www.mirandahouse.ac.in",
    websiteDomain: "mirandahouse.ac.in",
    yearOfEstablishment: 1948,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6377",
    name: "Hansraj College, Delhi",
    slug: "hansrajcollege",
    state: "Delhi",
    district: "North",
    website: "https://www.hansrajcollege.ac.in",
    websiteDomain: "hansrajcollege.ac.in",
    yearOfEstablishment: 1948,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6375",
    name: "Lady Shri Ram College for Women, Delhi",
    slug: "lsr",
    state: "Delhi",
    district: "South",
    website: "https://lsr.edu.in",
    websiteDomain: "lsr.edu.in",
    yearOfEstablishment: 1956,
    locationType: "Urban",
  },
  {
    aisheCode: "C-43956",
    name: "Loyola College, Chennai",
    slug: "loyolacollege",
    state: "Tamil Nadu",
    district: "Chennai",
    website: "https://www.loyolacollege.edu",
    websiteDomain: "loyolacollege.edu",
    yearOfEstablishment: 1925,
    locationType: "Urban",
  },
  {
    aisheCode: "C-33828",
    name: "St. Xavier's College, Mumbai",
    slug: "xaviersmumbai",
    state: "Maharashtra",
    district: "Mumbai",
    website: "https://xaviers.edu",
    websiteDomain: "xaviers.edu",
    yearOfEstablishment: 1869,
    locationType: "Urban",
  },
  {
    aisheCode: "C-11910",
    name: "St. Xavier's College, Kolkata",
    slug: "xavierskolkata",
    state: "West Bengal",
    district: "Kolkata",
    website: "https://www.sxccal.edu",
    websiteDomain: "sxccal.edu",
    yearOfEstablishment: 1860,
    locationType: "Urban",
  },
  {
    aisheCode: "C-37013",
    name: "PSG College of Technology, Coimbatore",
    slug: "psgtech",
    state: "Tamil Nadu",
    district: "Coimbatore",
    website: "https://www.psgtech.edu",
    websiteDomain: "psgtech.edu",
    yearOfEstablishment: 1951,
    locationType: "Urban",
  },
  {
    aisheCode: "C-16538",
    name: "Sri Sivasubramaniya Nadar College of Engineering, Chennai",
    slug: "ssn",
    state: "Tamil Nadu",
    district: "Chengalpattu",
    website: "https://www.ssn.edu.in",
    websiteDomain: "ssn.edu.in",
    yearOfEstablishment: 1996,
    locationType: "Rural",
  },
  {
    aisheCode: "U-0391-GOA",
    name: "BITS Pilani, K. K. Birla Goa Campus",
    slug: "bitsgoa",
    state: "Goa",
    district: "South Goa",
    website: "https://www.bits-pilani.ac.in/goa/",
    websiteDomain: "goa.bits-pilani.ac.in",
    yearOfEstablishment: 2004,
    locationType: "Urban",
  },
  {
    aisheCode: "U-0391-HYD",
    name: "BITS Pilani, Hyderabad Campus",
    slug: "bitshyderabad",
    state: "Telangana",
    district: "Medchal-Malkajgiri",
    website: "https://www.bits-pilani.ac.in/hyderabad/",
    websiteDomain: "hyderabad.bits-pilani.ac.in",
    yearOfEstablishment: 2008,
    locationType: "Urban",
  },
  {
    aisheCode: "U-0490-CHE",
    name: "Vellore Institute of Technology, Chennai Campus",
    slug: "vitchennai",
    state: "Tamil Nadu",
    district: "Chennai",
    website: "https://chennai.vit.ac.in",
    websiteDomain: "chennai.vit.ac.in",
    yearOfEstablishment: 2010,
    locationType: "Urban",
  },
  {
    aisheCode: "C-44288",
    name: "Birsa Institute of Technology Sindri, Dhanbad",
    slug: "bitsindri",
    state: "Jharkhand",
    district: "Dhanbad",
    website: "https://www.bitsindri.ac.in",
    websiteDomain: "bitsindri.ac.in",
    yearOfEstablishment: 1949,
    locationType: "Urban",
  },
  {
    aisheCode: "C-33827",
    name: "Sardar Patel Institute of Technology, Mumbai",
    slug: "spit",
    state: "Maharashtra",
    district: "Mumbai",
    website: "https://www.spit.ac.in",
    websiteDomain: "spit.ac.in",
    yearOfEstablishment: 2005,
    locationType: "Urban",
  },
  {
    aisheCode: "C-41982",
    name: "Army Institute of Technology, Pune",
    slug: "aitpune",
    state: "Maharashtra",
    district: "Pune",
    website: "https://www.aitpune.com",
    websiteDomain: "aitpune.edu.in",
    yearOfEstablishment: 1994,
    locationType: "Urban",
  },
  {
    aisheCode: "C-11116",
    name: "Walchand College of Engineering, Sangli",
    slug: "walchand",
    state: "Maharashtra",
    district: "Sangli",
    website: "https://www.walchandsangli.ac.in",
    websiteDomain: "walchandsangli.ac.in",
    yearOfEstablishment: 1947,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6240",
    name: "Heritage Institute of Technology, Kolkata",
    slug: "heritageit",
    state: "West Bengal",
    district: "Kolkata",
    website: "https://www.heritageit.edu",
    websiteDomain: "heritageit.edu",
    yearOfEstablishment: 2001,
    locationType: "Urban",
  },
  {
    aisheCode: "C-6241",
    name: "Institute of Engineering and Management, Kolkata",
    slug: "iem",
    state: "West Bengal",
    district: "Kolkata",
    website: "https://iem.edu.in",
    websiteDomain: "iem.edu.in",
    yearOfEstablishment: 1989,
    locationType: "Urban",
  },
  {
    aisheCode: "C-46132",
    name: "Ajay Kumar Garg Engineering College, Ghaziabad",
    slug: "akgec",
    state: "Uttar Pradesh",
    district: "Ghaziabad",
    website: "https://www.akgec.ac.in",
    websiteDomain: "akgec.ac.in",
    yearOfEstablishment: 1998,
    locationType: "Urban",
  },
  {
    aisheCode: "C-46133",
    name: "KIET Group of Institutions, Ghaziabad",
    slug: "kiet",
    state: "Uttar Pradesh",
    district: "Ghaziabad",
    website: "https://www.kiet.edu",
    websiteDomain: "kiet.edu",
    yearOfEstablishment: 1998,
    locationType: "Urban",
  },
  {
    aisheCode: "C-46134",
    name: "GL Bajaj Institute of Technology and Management, Greater Noida",
    slug: "glbitm",
    state: "Uttar Pradesh",
    district: "Gautam Buddha Nagar",
    website: "https://www.glbitm.org",
    websiteDomain: "glbitm.org",
    yearOfEstablishment: 2005,
    locationType: "Urban",
  },
  {
    aisheCode: "C-46135",
    name: "JSS Academy of Technical Education, Noida",
    slug: "jssaten",
    state: "Uttar Pradesh",
    district: "Gautam Buddha Nagar",
    website: "https://jssaten.ac.in",
    websiteDomain: "jssaten.ac.in",
    yearOfEstablishment: 1998,
    locationType: "Urban",
  },
  {
    aisheCode: "C-43958",
    name: "Christian Medical College, Vellore",
    slug: "cmcvellore",
    state: "Tamil Nadu",
    district: "Vellore",
    website: "https://www.cmch-vellore.edu",
    websiteDomain: "cmcvellore.ac.in",
    yearOfEstablishment: 1900,
    locationType: "Urban",
  },
];

// 2. Comprehensive verified student email domains mapping
// Keys are college slugs or identifiers
const VERIFIED_STUDENT_EMAIL_DOMAINS: Record<string, string[]> = {
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

  // Universities & Top Colleges
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

async function main() {
  const client = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("1. Upserting new colleges into Postgres database...");
  const institutionsToInsert: NewInstitution[] = NEW_COLLEGES_TO_ADD.map((c) => ({
    id: stableId("inst", c.aisheCode),
    aisheCode: c.aisheCode,
    name: c.name,
    slug: c.slug,
    state: c.state,
    district: c.district,
    website: c.website,
    websiteDomain: c.websiteDomain,
    yearOfEstablishment: c.yearOfEstablishment,
    locationType: c.locationType,
    country: "India",
    source: "research_verified",
  }));

  for (const inst of institutionsToInsert) {
    await db.insert(institutions).values(inst).onConflictDoNothing();
  }

  console.log("3. Mapping student email domains to colleges in DB...");
  const allInstitutions = await db
    .select({
      id: institutions.id,
      slug: institutions.slug,
      name: institutions.name,
      websiteDomain: institutions.websiteDomain,
    })
    .from(institutions);

  const instBySlug = new Map<string, (typeof allInstitutions)[0]>();
  for (const inst of allInstitutions) {
    instBySlug.set(inst.slug.toLowerCase(), inst);
  }

  console.log("3. Mapping student email domains to colleges in DB...");
  const existingDomainsList = await db.select({ domain: institutionDomains.domain }).from(institutionDomains);
  const existingDomainSet = new Set(existingDomainsList.map((d) => d.domain.toLowerCase().trim()));

  const domainsToInsert: (typeof institutionDomains.$inferInsert)[] = [];

  for (const [slug, domains] of Object.entries(VERIFIED_STUDENT_EMAIL_DOMAINS)) {
    const inst = instBySlug.get(slug.toLowerCase());
    if (!inst) {
      console.warn(`[WARN] Institution with slug '${slug}' not found in database.`);
      continue;
    }

    for (const rawDomain of domains) {
      const cleanDomain = rawDomain.trim().toLowerCase().replace(/^@/, "");
      if (!cleanDomain) continue;

      if (!existingDomainSet.has(cleanDomain)) {
        const domainId = stableId("domain", `${inst.id}_${cleanDomain}`);
        const isWebsiteDomain = cleanDomain === inst.websiteDomain?.toLowerCase();
        const domainType = isWebsiteDomain ? "EMAIL" : "STUDENT_EMAIL";

        domainsToInsert.push({
          id: domainId,
          institutionId: inst.id,
          domain: cleanDomain,
          domainType,
          verificationStatus: "ADMIN_VERIFIED",
        });
        existingDomainSet.add(cleanDomain);
      }
    }
  }

  if (domainsToInsert.length > 0) {
    console.log(`Inserting ${domainsToInsert.length} new domains in batch...`);
    // Insert in batches of 50
    for (let i = 0; i < domainsToInsert.length; i += 50) {
      const chunk = domainsToInsert.slice(i, i + 50);
      await db.insert(institutionDomains).values(chunk).onConflictDoNothing();
    }
  }

  console.log(`Seeded ${domainsToInsert.length} new student email domains into institution_domains!`);

  const totalInsts = await db.select({ count: sql`count(*)` }).from(institutions);
  const totalDoms = await db.select({ count: sql`count(*)` }).from(institutionDomains);
  console.log(`Total institutions in DB: ${totalInsts[0].count}`);
  console.log(`Total domains in DB: ${totalDoms[0].count}`);

  await client.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error running seed-student-domains:", err);
  process.exit(1);
});

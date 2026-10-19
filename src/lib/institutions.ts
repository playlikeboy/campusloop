import { asc, eq, inArray, or } from "drizzle-orm";

import { getDb } from "@/db";
import { institutionDomains, institutions } from "@/db/schema";
import {
  getCandidateParentDomains,
  VERIFIED_STUDENT_EMAIL_DOMAINS,
} from "./student-email-domains";

export { getCandidateParentDomains, VERIFIED_STUDENT_EMAIL_DOMAINS };

export type InstitutionOption = {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  district: string | null;
  website: string | null;
  websiteDomain: string | null;
};

export function extractEmailDomain(email?: string | null) {
  const domain = email?.split("@")[1]?.trim().toLowerCase();
  return domain || null;
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export async function listInstitutionOptions(): Promise<InstitutionOption[]> {
  const db = getDb();

  return db
    .select({
      id: institutions.id,
      name: institutions.name,
      slug: institutions.slug,
      state: institutions.state,
      district: institutions.district,
      website: institutions.website,
      websiteDomain: institutions.websiteDomain,
    })
    .from(institutions)
    .orderBy(asc(institutions.name));
}

/**
 * Finds an institution by exact domain match, or hierarchically via parent subdomain.
 * E.g., "kgpian.iitkgp.ac.in" -> IIT Kharagpur
 *       "smail.iitm.ac.in" -> IIT Madras
 *       "vitstudent.ac.in" -> VIT Vellore
 *       "learner.manipal.edu" -> Manipal Academy of Higher Education
 *       "pilani.bits-pilani.ac.in" -> BITS Pilani
 */
export async function findInstitutionByDomain(domain: string): Promise<InstitutionOption | null> {
  try {
    const db = getDb();
    if (!db || typeof db.select !== "function") return null;

    const cleanDomain = (domain || "").trim().toLowerCase().replace(/^@/, "");
    if (!cleanDomain) return null;

    // 1. Exact match in institution_domains table (fast indexed query)
    const [exactMatch] = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        slug: institutions.slug,
        state: institutions.state,
        district: institutions.district,
        website: institutions.website,
        websiteDomain: institutions.websiteDomain,
      })
      .from(institutionDomains)
      .innerJoin(institutions, eq(institutionDomains.institutionId, institutions.id))
      .where(eq(institutionDomains.domain, cleanDomain))
      .limit(1);

    if (exactMatch) {
      return exactMatch;
    }

    // 2. Hierarchical subdomain match (e.g., student.cse.iitkgp.ac.in -> iitkgp.ac.in)
    const candidateParents = getCandidateParentDomains(cleanDomain);
    if (candidateParents.length > 0) {
      const [parentMatch] = await db
        .select({
          id: institutions.id,
          name: institutions.name,
          slug: institutions.slug,
          state: institutions.state,
          district: institutions.district,
          website: institutions.website,
          websiteDomain: institutions.websiteDomain,
        })
        .from(institutionDomains)
        .innerJoin(institutions, eq(institutionDomains.institutionId, institutions.id))
        .where(inArray(institutionDomains.domain, candidateParents))
        .limit(1);

      if (parentMatch) {
        return parentMatch;
      }
    }

    // 3. Fallback: match directly on websiteDomain
    const [websiteMatch] = await db
      .select({
        id: institutions.id,
        name: institutions.name,
        slug: institutions.slug,
        state: institutions.state,
        district: institutions.district,
        website: institutions.website,
        websiteDomain: institutions.websiteDomain,
      })
      .from(institutions)
      .where(eq(institutions.websiteDomain, cleanDomain))
      .limit(1);

    if (websiteMatch) {
      return websiteMatch;
    }

    if (candidateParents.length > 0) {
      const [parentWebsiteMatch] = await db
        .select({
          id: institutions.id,
          name: institutions.name,
          slug: institutions.slug,
          state: institutions.state,
          district: institutions.district,
          website: institutions.website,
          websiteDomain: institutions.websiteDomain,
        })
        .from(institutions)
        .where(inArray(institutions.websiteDomain, candidateParents))
        .limit(1);

      if (parentWebsiteMatch) {
        return parentWebsiteMatch;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Shared helper to find a whitelisted domain row with its associated institution.
 * Supports exact domain matching and hierarchical subdomain matching.
 */
export async function findWhitelistedDomain(domain: string) {
  try {
    const db = getDb();
    if (!db || !db.query?.institutionDomains) return null;

    const cleanDomain = (domain || "").trim().toLowerCase().replace(/^@/, "");
    if (!cleanDomain) return null;

    // 1. Exact match
    const exact = await db.query.institutionDomains.findFirst({
      where: eq(institutionDomains.domain, cleanDomain),
      with: { institution: true },
    });
    if (exact?.institution) {
      return exact;
    }

    // 2. Subdomain parent match
    const candidateParents = getCandidateParentDomains(cleanDomain);
    if (candidateParents.length > 0) {
      const parent = await db.query.institutionDomains.findFirst({
        where: inArray(institutionDomains.domain, candidateParents),
        with: { institution: true },
      });
      if (parent?.institution) {
        return parent;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function getInstitutionAllowedDomains(collegeIdOrSlug: string): Promise<{
  institution: InstitutionOption | null;
  domains: string[];
}> {
  try {
    const db = getDb();
    if (!db || !db.query?.institutions) {
      return { institution: null, domains: [] };
    }
    const cleanId = collegeIdOrSlug.trim();
    const inst = await db.query.institutions.findFirst({
      where: or(eq(institutions.id, cleanId), eq(institutions.slug, cleanId)),
      with: {
        domains: true,
      },
    });

    if (!inst) {
      return { institution: null, domains: [] };
    }

    const domainSet = new Set<string>();
    if (inst.domains) {
      for (const d of inst.domains) {
        if (d.domain) domainSet.add(d.domain.toLowerCase().trim());
      }
    }
    if (inst.websiteDomain) {
      domainSet.add(inst.websiteDomain.toLowerCase().trim());
    }

    // Also include verified student email domains from curate list if available
    const curated = VERIFIED_STUDENT_EMAIL_DOMAINS[inst.slug.toLowerCase()];
    if (curated) {
      for (const d of curated) {
        domainSet.add(d.toLowerCase().trim());
      }
    }

    return {
      institution: {
        id: inst.id,
        name: inst.name,
        slug: inst.slug,
        state: inst.state,
        district: inst.district,
        website: inst.website,
        websiteDomain: inst.websiteDomain,
      },
      domains: Array.from(domainSet),
    };
  } catch {
    return { institution: null, domains: [] };
  }
}

export async function validateEmailDomainForInstitution(
  emailOrDomain: string,
  collegeIdOrSlug?: string | null
): Promise<{
  valid: boolean;
  normalizedDomain: string;
  collegeName?: string;
  allowedDomains?: string[];
  error?: string;
}> {
  const rawDomain = emailOrDomain.includes("@")
    ? emailOrDomain.split("@")[1]
    : emailOrDomain;
  const normalizedDomain = (rawDomain || "").trim().toLowerCase().replace(/^@/, "");

  if (!normalizedDomain) {
    return { valid: false, normalizedDomain: "", error: "Invalid email domain format." };
  }

  // Reject personal / generic public webmail providers
  const BLOCKED_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "zoho.com",
    "mail.com",
    "gmx.com",
    "yandex.com",
  ]);

  if (BLOCKED_DOMAINS.has(normalizedDomain)) {
    return {
      valid: false,
      normalizedDomain,
      error: `Personal email (@${normalizedDomain}) is not permitted. Please use your official university email.`,
    };
  }

  if (collegeIdOrSlug) {
    const { institution, domains } = await getInstitutionAllowedDomains(collegeIdOrSlug);
    if (institution) {
      const isAllowed = domains.some((d) => {
        const lowerD = d.toLowerCase().trim();
        return lowerD === normalizedDomain || normalizedDomain.endsWith("." + lowerD);
      });

      if (!isAllowed && domains.length > 0) {
        return {
          valid: false,
          normalizedDomain,
          collegeName: institution.name,
          allowedDomains: domains,
          error: `Domain '@${normalizedDomain}' is not recognized for ${institution.name}. Allowed domains: ${domains.map((d) => `@${d}`).join(", ")}`,
        };
      }
      return {
        valid: true,
        normalizedDomain,
        collegeName: institution.name,
        allowedDomains: domains,
      };
    }
  }

  // If no specific college provided, check if it belongs to any registered institution
  const matchedInst = await findInstitutionByDomain(normalizedDomain);
  if (matchedInst) {
    return {
      valid: true,
      normalizedDomain,
      collegeName: matchedInst.name,
    };
  }

  // Allow general educational domains (.ac.in, .edu.in, .edu)
  const isEduDomain =
    normalizedDomain.endsWith(".ac.in") ||
    normalizedDomain.endsWith(".edu.in") ||
    normalizedDomain.endsWith(".edu");

  if (!isEduDomain) {
    return {
      valid: false,
      normalizedDomain,
      error: `Domain '@${normalizedDomain}' must be an accredited academic domain (.edu, .ac.in, .edu.in).`,
    };
  }

  return { valid: true, normalizedDomain };
}

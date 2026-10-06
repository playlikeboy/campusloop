import { asc, eq, or } from "drizzle-orm";

import { getDb } from "@/db";
import { institutionDomains, institutions } from "@/db/schema";

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

export async function findInstitutionByDomain(domain: string): Promise<InstitutionOption | null> {
  try {
    const db = getDb();
    if (!db || typeof db.select !== "function") return null;
    const [match] = await db
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
      .where(eq(institutionDomains.domain, domain))
      .limit(1);

    return match ?? null;
  } catch (err) {
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
      const isAllowed = domains.some((d) => d.toLowerCase() === normalizedDomain);
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

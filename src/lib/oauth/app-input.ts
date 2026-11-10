import { isValidRedirectUri } from "./policy";

/** Developer-portal app registration input, validated and normalised (client-safe, unit-tested). */

export interface AppInput {
  name: string;
  description: string;
  homepageUrl: string;
  logoUrl: string;
  privacyUrl: string;
  termsUrl: string;
  type: "CONFIDENTIAL" | "PUBLIC";
  redirectUris: string[];
}

const httpsUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname));
  } catch {
    return false;
  }
};

export function validateAppInput(raw: unknown): { ok: true; value: AppInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof r[k] === "string" ? (r[k] as string).trim().slice(0, max) : "");
  const name = str("name", 60);
  if (name.length < 2) return { ok: false, error: "App name must be at least 2 characters." };
  if (/campus\s*loop/i.test(name)) return { ok: false, error: "App names can't include \"CampusLoop\", so students aren't misled." };

  const urls = { homepageUrl: str("homepageUrl", 500), logoUrl: str("logoUrl", 500), privacyUrl: str("privacyUrl", 500), termsUrl: str("termsUrl", 500) };
  for (const [k, v] of Object.entries(urls)) if (v && !httpsUrl(v)) return { ok: false, error: `${k.replace("Url", "")} link must be an https:// address.` };

  const list = Array.isArray(r.redirectUris) ? r.redirectUris : typeof r.redirectUris === "string" ? r.redirectUris.split(/[\s,]+/) : [];
  const redirectUris = [...new Set(list.map((u) => String(u).trim()).filter(Boolean))];
  if (redirectUris.length === 0) return { ok: false, error: "Add at least one redirect URI." };
  if (redirectUris.length > 10) return { ok: false, error: "Up to 10 redirect URIs." };
  const bad = redirectUris.find((u) => !isValidRedirectUri(u));
  if (bad) return { ok: false, error: `"${bad}" is not allowed. Use https://, http://localhost for development, or an app scheme like com.example.app:/callback.` };

  return {
    ok: true,
    value: { name, description: str("description", 300), ...urls, type: r.type === "PUBLIC" ? "PUBLIC" : "CONFIDENTIAL", redirectUris },
  };
}

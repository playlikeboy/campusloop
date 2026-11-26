import { BLOCKED_PERSONAL_DOMAINS, isCollegeEmail } from "@/lib/user-verification";

/**
 * Trust tiers
 * -----------
 * One source of truth for "who is a verified student" and "what can an
 * unverified member do". Pure: no database, no request. The settings come from
 * `getMemberAccess()` in src/lib/trust-server.ts and are passed in.
 *
 * - verified: proved student status (college email confirmed by the sign-in
 *   provider, GitHub Student Developer Pack, or an admin), or is an ADMIN.
 * - member:   everyone else: signed in with gmail/outlook, or a college address
 *   that was never confirmed. Members join a real campus and get the normal
 *   app; admins decide which actions they can take.
 *
 * `user_profiles.is_college_verified` stays the single "verified" flag that
 * every badge and filter reads, whatever the route. `verification_method`
 * records which route it was.
 */

export type TrustTier = "verified" | "member";

export const VERIFICATION_METHODS = ["college_email", "github_student", "admin"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export interface TrustSubject {
  role?: string | null;
  isCollegeVerified?: boolean | null;
}

export function resolveTrustTier(profile: TrustSubject | null | undefined): TrustTier {
  if (!profile) return "member";
  if (profile.role === "ADMIN") return "verified";
  if (profile.isCollegeVerified === true) return "verified";
  return "member";
}

export function isVerifiedStudent(profile: TrustSubject | null | undefined): boolean {
  return resolveTrustTier(profile) === "verified";
}

export function isVerificationMethod(value: unknown): value is VerificationMethod {
  return typeof value === "string" && (VERIFICATION_METHODS as readonly string[]).includes(value);
}

export type EmailDomainKind = "college" | "personal" | "other" | "invalid";

/**
 * Classifies a sign-in address. "college" means the domain looks academic; it
 * still only verifies once the provider confirms the inbox.
 */
export function classifyEmailDomain(email: string | null | undefined): EmailDomainKind {
  if (!email || !email.includes("@")) return "invalid";
  const domain = email.split("@").pop()?.trim().toLowerCase();
  if (!domain || !domain.includes(".")) return "invalid";
  if (BLOCKED_PERSONAL_DOMAINS.has(domain) || PERSONAL_EXTRA.has(domain)) return "personal";
  if (isCollegeEmail(email)) return "college";
  return "other";
}

/** Common webmail hosts not in BLOCKED_PERSONAL_DOMAINS. */
const PERSONAL_EXTRA = new Set([
  "googlemail.com",
  "live.com",
  "msn.com",
  "rediffmail.com",
  "ymail.com",
  "me.com",
  "proton.me",
  "pm.me",
  "outlook.in",
  "yahoo.in",
  "yahoo.co.in",
  "hotmail.co.uk",
]);

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export const CAPABILITIES = [
  "post",
  "comment",
  "vote",
  "chat_dm",
  "join_community",
  "create_community",
  "anonymous_post",
  "campus_match",
  "secret_crush",
  "events_create",
  "events_register",
  "upload_media",
  "stories",
  "play",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export interface CapabilityInfo {
  /** Admin toggle: "Allow unverified members to …" */
  label: string;
  /** Verify-to-unlock sheet title. */
  lockedTitle: string;
  /** Default for members when no admin setting is saved. */
  memberDefault: boolean;
  /** Why the default is what it is, shown on the admin page. */
  note?: string;
}

export const CAPABILITY_INFO: Record<Capability, CapabilityInfo> = {
  post: { label: "post, poll and ask questions", lockedTitle: "Verify to post", memberDefault: true },
  comment: { label: "comment and reply", lockedTitle: "Verify to comment", memberDefault: true },
  vote: { label: "upvote, react and vote in polls", lockedTitle: "Verify to vote", memberDefault: true },
  chat_dm: { label: "send direct messages", lockedTitle: "Verify to send messages", memberDefault: true },
  join_community: { label: "join communities", lockedTitle: "Verify to join communities", memberDefault: true },
  create_community: {
    label: "create communities",
    lockedTitle: "Verify to create a community",
    memberDefault: false,
    note: "Off by default: a community needs an accountable owner.",
  },
  anonymous_post: {
    label: "post anonymously and confess",
    lockedTitle: "Verify to post anonymously",
    memberDefault: false,
    note: "Off by default: anonymity without a real identity behind it invites abuse.",
  },
  campus_match: {
    label: "use Campus Match",
    lockedTitle: "Verify to use Campus Match",
    memberDefault: false,
    note: "Off by default: matching needs to know the other person is a real student.",
  },
  secret_crush: {
    label: "send a Secret Crush",
    lockedTitle: "Verify to send a Secret Crush",
    memberDefault: false,
    note: "Off by default, for the same reason as Campus Match.",
  },
  events_create: {
    label: "create events",
    lockedTitle: "Verify to create events",
    memberDefault: false,
    note: "Off by default: events are announced to a whole campus.",
  },
  events_register: { label: "register for events", lockedTitle: "Verify to register", memberDefault: true },
  upload_media: { label: "upload photos, videos and files", lockedTitle: "Verify to upload", memberDefault: true },
  stories: { label: "post stories and highlights", lockedTitle: "Verify to post a story", memberDefault: true },
  play: { label: "play games and enter DP Battle", lockedTitle: "Verify to play", memberDefault: true },
};

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && (CAPABILITIES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Member access settings (stored as JSON in platform_settings.member_access)
// ---------------------------------------------------------------------------

export interface MemberAccessSettings {
  /** Master switch. Off: unverified members are read-only. */
  membersCanParticipate: boolean;
  capabilities: Record<Capability, boolean>;
  /** A member's first N posts wait in the admin review queue. 0 turns it off. */
  reviewFirstPosts: number;
  /** Per-member hourly budgets from MEMBER_HOURLY_LIMITS in src/lib/rate-limits.ts. */
  strictRateLimits: boolean;
}

export const MEMBER_ACCESS_SETTING_KEY = "member_access";
export const MAX_REVIEW_FIRST_POSTS = 20;

export function defaultMemberAccess(): MemberAccessSettings {
  const capabilities = {} as Record<Capability, boolean>;
  for (const cap of CAPABILITIES) capabilities[cap] = CAPABILITY_INFO[cap].memberDefault;
  return { membersCanParticipate: true, capabilities, reviewFirstPosts: 2, strictRateLimits: true };
}

/** Parses the stored JSON. Anything missing or malformed falls back to the default. */
export function parseMemberAccess(raw: string | null | undefined): MemberAccessSettings {
  const base = defaultMemberAccess();
  if (!raw) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  return normalizeMemberAccess(data, base);
}

export function normalizeMemberAccess(
  data: unknown,
  base: MemberAccessSettings = defaultMemberAccess()
): MemberAccessSettings {
  if (!data || typeof data !== "object") return base;
  const obj = data as Record<string, unknown>;
  const out: MemberAccessSettings = {
    ...base,
    capabilities: { ...base.capabilities },
  };
  if (typeof obj.membersCanParticipate === "boolean") out.membersCanParticipate = obj.membersCanParticipate;
  if (typeof obj.strictRateLimits === "boolean") out.strictRateLimits = obj.strictRateLimits;
  if (typeof obj.reviewFirstPosts === "number" && Number.isFinite(obj.reviewFirstPosts)) {
    out.reviewFirstPosts = Math.max(0, Math.min(MAX_REVIEW_FIRST_POSTS, Math.floor(obj.reviewFirstPosts)));
  }
  const caps = obj.capabilities;
  if (caps && typeof caps === "object") {
    for (const [key, value] of Object.entries(caps as Record<string, unknown>)) {
      if (isCapability(key) && typeof value === "boolean") out.capabilities[key] = value;
    }
  }
  return out;
}

/** Can someone in this tier use this capability under these settings? */
export function tierAllows(tier: TrustTier, capability: Capability, settings: MemberAccessSettings): boolean {
  if (tier === "verified") return true;
  if (!settings.membersCanParticipate) return false;
  return settings.capabilities[capability] === true;
}

export function canUse(
  profile: TrustSubject | null | undefined,
  capability: Capability,
  settings: MemberAccessSettings
): boolean {
  if (!profile) return false;
  return tierAllows(resolveTrustTier(profile), capability, settings);
}

/** Every capability this profile can use, for the client shell. */
export function allowedCapabilities(
  profile: TrustSubject | null | undefined,
  settings: MemberAccessSettings
): Capability[] {
  return CAPABILITIES.filter((cap) => canUse(profile, cap, settings));
}

/** What the app shell knows about the signed-in student's trust, for client-side gating. */
export interface ClientTrust {
  tier: TrustTier;
  verificationMethod: string | null;
  /** Still in the old Campus Preview "Viewer Hub": show "Pick your college". */
  inViewerHub: boolean;
  allowed: Capability[];
}

export const VERIFY_TO_UNLOCK = "VERIFY_TO_UNLOCK" as const;

export interface VerifyToUnlockBody {
  error: string;
  code: typeof VERIFY_TO_UNLOCK;
  capability: Capability;
}

export function verifyToUnlockBody(capability: Capability): VerifyToUnlockBody {
  return {
    error: `${CAPABILITY_INFO[capability].lockedTitle}. Verify your student status with your college email or the GitHub Student Developer Pack.`,
    code: VERIFY_TO_UNLOCK,
    capability,
  };
}

/** Client-side check for a 403 body from requireCapability. */
export function isVerifyToUnlockBody(body: unknown): body is VerifyToUnlockBody {
  return (
    Boolean(body) &&
    typeof body === "object" &&
    (body as { code?: unknown }).code === VERIFY_TO_UNLOCK &&
    isCapability((body as { capability?: unknown }).capability)
  );
}

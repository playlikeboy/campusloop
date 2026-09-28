/**
 * SSRF (Server-Side Request Forgery) Defense Engine
 *
 * Validates external URLs against private IP ranges, cloud metadata services,
 * loopback, internal hostnames, and unsafe protocols before outbound HTTP requests.
 */

// Private & reserved IPv4 blocks:
// 0.0.0.0/8       (Current network)
// 10.0.0.0/8      (Private network - RFC 1918)
// 100.64.0.0/10   (Shared address space - RFC 6598)
// 127.0.0.0/8     (Loopback)
// 169.254.0.0/16  (Link-local / Cloud metadata - AWS, GCP, Azure, DigitalOcean)
// 172.16.0.0/12   (Private network - RFC 1918)
// 192.0.0.0/24    (IETF Protocol Assignments)
// 192.168.0.0/16  (Private network - RFC 1918)
// 198.18.0.0/15   (Benchmarking)
// 224.0.0.0/4     (Multicast)
// 240.0.0.0/4     (Reserved / Broadcast)

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "broadcasthost",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
]);

const BLOCKED_DOMAINS_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".home.arpa",
  ".localdomain",
  ".intranet",
];

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

/**
 * Checks if an IPv4 address (as 4 numeric octets) is in a private,
 * loopback, link-local, or reserved range.
 */
function isPrivateIPv4(o1: number, o2: number, o3: number, o4: number): boolean {
  if (o1 === 0) return true; // 0.0.0.0/8
  if (o1 === 10) return true; // 10.0.0.0/8
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // 100.64.0.0/10
  if (o1 === 127) return true; // 127.0.0.0/8
  if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16 (AWS/cloud metadata)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12
  if (o1 === 192 && o2 === 0 && o3 === 0) return true; // 192.0.0.0/24
  if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16
  if (o1 === 198 && (o2 === 18 || o2 === 19)) return true; // 198.18.0.0/15
  if (o1 >= 224) return true; // Multicast (224.0.0.0/4) & Reserved (240.0.0.0/4)
  return false;
}

/**
 * Parses numeric IPv4 representations (standard decimal dotted quad, hex, octal, dword).
 * Returns [o1, o2, o3, o4] or null if not a valid IPv4.
 */
function parseIPv4(host: string): [number, number, number, number] | null {
  // 1. Dotted representation: e.g. 127.0.0.1, 0x7f.0.0.1, 0177.0.0.1
  const parts = host.split(".");
  if (parts.length === 4) {
    const octets: number[] = [];
    for (const part of parts) {
      let num: number;
      if (part.startsWith("0x") || part.startsWith("0X")) {
        num = Number.parseInt(part, 16);
      } else if (part.startsWith("0") && part.length > 1 && /^[0-7]+$/.test(part)) {
        num = Number.parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        num = Number.parseInt(part, 10);
      } else {
        return null;
      }
      if (isNaN(num) || num < 0 || num > 255) return null;
      octets.push(num);
    }
    return [octets[0], octets[1], octets[2], octets[3]];
  }

  // 2. Single integer / dword representation: e.g. 2130706433 (127.0.0.1)
  if (/^\d+$/.test(host)) {
    const dword = Number.parseInt(host, 10);
    if (!isNaN(dword) && dword >= 0 && dword <= 0xffffffff) {
      return [
        (dword >>> 24) & 0xff,
        (dword >>> 16) & 0xff,
        (dword >>> 8) & 0xff,
        dword & 0xff,
      ];
    }
  }

  // 3. Single hex representation: e.g. 0x7f000001
  if (/^0x[0-9a-fA-F]+$/i.test(host)) {
    const hexVal = Number.parseInt(host, 16);
    if (!isNaN(hexVal) && hexVal >= 0 && hexVal <= 0xffffffff) {
      return [
        (hexVal >>> 24) & 0xff,
        (hexVal >>> 16) & 0xff,
        (hexVal >>> 8) & 0xff,
        hexVal & 0xff,
      ];
    }
  }

  return null;
}

/**
 * Checks if an IPv6 address string is private, loopback, or reserved.
 */
function isPrivateIPv6(host: string): boolean {
  const clean = host.replace(/^\[|\]$/g, "").toLowerCase();

  // Loopback & Unspecified
  if (clean === "::1" || clean === "::" || clean === "0:0:0:0:0:0:0:1" || clean === "0:0:0:0:0:0:0:0") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (clean.startsWith("::ffff:")) {
    const v4Part = clean.slice(7);
    const parsedV4 = parseIPv4(v4Part);
    if (parsedV4) {
      return isPrivateIPv4(...parsedV4);
    }
    return true; // Malformed IPv4-mapped address is considered unsafe
  }

  // Unique Local Addresses (fc00::/7 -> fc.. or fd..)
  if (clean.startsWith("fc") || clean.startsWith("fd")) {
    return true;
  }

  // Link-Local Addresses (fe80::/10 -> fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(clean)) {
    return true;
  }

  // Discard prefix (100::/64)
  if (clean.startsWith("100:")) {
    return true;
  }

  return false;
}

export interface SsrCheckResult {
  safe: boolean;
  reason?: string;
  url?: URL;
}

/**
 * Evaluates whether a URL targets a public, safe, non-internal destination.
 */
export function isSafePublicUrl(rawUrl: string | URL): SsrCheckResult {
  let parsed: URL;
  try {
    parsed = typeof rawUrl === "string" ? new URL(rawUrl.trim()) : rawUrl;
  } catch {
    return { safe: false, reason: "Malformed URL syntax" };
  }

  // 1. Protocol check
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.` };
  }

  // 2. Port check
  if (!ALLOWED_PORTS.has(parsed.port)) {
    return { safe: false, reason: `Disallowed port: ${parsed.port}. Only standard web ports are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase().trim();

  if (!hostname) {
    return { safe: false, reason: "Missing or empty hostname" };
  }

  // 3. Known internal/cloud hostnames check
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: `Blocked internal or metadata host: ${hostname}` };
  }

  for (const suffix of BLOCKED_DOMAINS_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      return { safe: false, reason: `Blocked private or local domain suffix: ${suffix}` };
    }
  }

  // 4. IPv4 check
  const v4 = parseIPv4(hostname);
  if (v4) {
    if (isPrivateIPv4(...v4)) {
      return { safe: false, reason: `Blocked private, link-local, or loopback IPv4 address: ${v4.join(".")}` };
    }
    return { safe: true, url: parsed };
  }

  // 5. IPv6 check
  if (hostname.includes(":") || (hostname.startsWith("[") && hostname.endsWith("]"))) {
    if (isPrivateIPv6(hostname)) {
      return { safe: false, reason: `Blocked private or loopback IPv6 address: ${hostname}` };
    }
    return { safe: true, url: parsed };
  }

  // Hostname is a valid domain name
  return { safe: true, url: parsed };
}

/**
 * Safe fetch wrapper that enforces SSRF checks on the initial request
 * and on every redirect destination.
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  maxRedirects = 3
): Promise<Response> {
  let currentUrl = url;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const check = isSafePublicUrl(currentUrl);
    if (!check.safe) {
      throw new Error(`SSRF Prevention: Refusing to request ${currentUrl} (${check.reason})`);
    }

    const fetchOptions: RequestInit = {
      ...options,
      redirect: "manual", // Intercept redirects to validate target
    };

    const response = await fetch(currentUrl, fetchOptions);

    // If not a redirect, return response
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    // Inspect redirect target
    const location = response.headers.get("location");
    if (!location) {
      return response; // No location header, let caller handle
    }

    redirectsCount++;
    if (redirectsCount > maxRedirects) {
      throw new Error("Too many redirects");
    }

    // Resolve relative or absolute redirect URL
    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error("Too many redirects");
}

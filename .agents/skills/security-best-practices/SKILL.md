---
name: "security-best-practices"
description: "Use when explicitly reviewing secure-by-default JavaScript/TypeScript web application code in CampusLoop, especially publishing, uploads, embeds, authZ, and user-controlled URLs."
---

# Security Best Practices

Review both frontend and backend security.

For CampusLoop post work, always inspect:

- publish APIs
- comment APIs
- media upload paths
- embed preview endpoints
- external URL fetching
- authentication and authorization
- anonymity boundaries
- notifications
- structured data
- rate limits and abuse controls

Prioritize:

1. authorization bypass
2. identity/privacy leaks
3. SSRF
4. stored/reflected XSS
5. unsafe URL handling
6. unrestricted uploads
7. replay/double-submit
8. denial-of-service through expensive parsing or external fetches

When reporting a finding, include:

- concrete asset
- attacker-controlled input
- trust boundary
- impact
- existing control
- missing control
- exact source location
- regression test

Never call a security control effective unless the source or runtime evidence supports it.

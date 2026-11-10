/**
 * Shared <head> fragment for the standalone MCP documentation pages
 * (/mcp/events, /mcp/articles, /mcp/academics). These pages are served as raw
 * HTML outside the Next.js app, so they never load globals.css. The semantic
 * variables below mirror src/styles/tokens.css so the pages still follow the
 * design system; Tailwind (CDN) maps the same utility names onto them.
 */

const SEMANTIC_VARS = [
  "bg",
  "surface",
  "surface-muted",
  "fg",
  "fg-muted",
  "fg-subtle",
  "border",
  "brand",
  "brand-hover",
  "brand-fg",
  "brand-text",
  "brand-subtle",
  "brand-subtle-border",
  "success",
  "success-fg",
  "success-subtle",
  "danger",
  "danger-fg",
  "danger-subtle",
  "warning",
  "warning-fg",
  "warning-subtle",
] as const;

const TAILWIND_COLORS = Object.fromEntries(SEMANTIC_VARS.map((name) => [name, `var(--${name})`]));

export const MCP_DOCS_STYLE = `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
  <style>
    /* ds-allow: standalone page without globals.css; values mirror tokens.css light theme */
    :root { --bg: #ffffff; --surface: #ffffff; --surface-muted: #f5f3fa; --fg: #15131d; --fg-muted: #57526a; --fg-subtle: #6c6780; --border: #e2deec; --brand: #6b3df5; --brand-hover: #5a2be0; --brand-fg: #ffffff; --brand-text: #5a2be0; --brand-subtle: #f2edff; --brand-subtle-border: #d0c0ff; --success: #0b7a55; --success-fg: #ffffff; --success-subtle: #ddf8ec; --danger: #b81d31; --danger-fg: #ffffff; --danger-subtle: #ffe5e8; --warning: #a84f05; --warning-fg: #ffffff; --warning-subtle: #fff0d9; color-scheme: light; }
    @media (prefers-color-scheme: dark) {
      /* ds-allow: standalone page without globals.css; values mirror tokens.css dark theme */
      :root { --bg: #0d0a17; --surface: #120e1f; --surface-muted: #211b30; --fg: #f5f3fa; --fg-muted: #cbc6d9; --fg-subtle: #a7a1ba; --border: #2a2439; --brand: #7650fa; --brand-hover: #6b3df5; --brand-fg: #ffffff; --brand-text: #b8a2ff; --brand-subtle: #24164f; --brand-subtle-border: #3a1a91; --success: #3ddc97; --success-fg: #15131d; --success-subtle: #0e3a2a; --danger: #ff7a85; --danger-fg: #15131d; --danger-subtle: #4a1219; --warning: #ffb547; --warning-fg: #15131d; --warning-subtle: #452c08; color-scheme: dark; }
    }
    body { font-family: "Figtree", "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--fg); }
    h1, h2, h3, h4 { font-family: "Bricolage Grotesque", "Figtree", system-ui, sans-serif; letter-spacing: -0.02em; }
    ::selection { background: var(--brand-subtle); color: var(--fg); }
    a { text-underline-offset: 3px; }
    pre, code { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>`;

/** Tailwind CDN plus a config that exposes the semantic palette as utilities. */
export const MCP_DOCS_TAILWIND = `<script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = ${JSON.stringify({ theme: { extend: { colors: TAILWIND_COLORS } } })};</script>
  ${MCP_DOCS_STYLE}`;

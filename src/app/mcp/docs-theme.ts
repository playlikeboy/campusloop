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

export const MCP_DOCS_STYLE = `<style>
    /* ds-allow: standalone page without globals.css; values mirror tokens.css light theme */
    :root { --bg: #fcfbf8; --surface: #ffffff; --surface-muted: #f7f6f2; --fg: #1c1b18; --fg-muted: #5c5850; --fg-subtle: #6e6a61; --border: #e2dfd7; --brand: #3b5bfd; --brand-hover: #2a45e0; --brand-fg: #ffffff; --brand-text: #2a45e0; --brand-subtle: #eef2ff; --brand-subtle-border: #bcc9ff; --success: #15803d; --success-fg: #ffffff; --success-subtle: #dcfce7; --danger: #b91c1c; --danger-fg: #ffffff; --danger-subtle: #fee2e2; --warning: #b45309; --warning-fg: #ffffff; --warning-subtle: #fef3c7; color-scheme: light; }
    @media (prefers-color-scheme: dark) {
      /* ds-allow: standalone page without globals.css; values mirror tokens.css dark theme */
      :root { --bg: #12110f; --surface: #1c1b18; --surface-muted: #2d2b27; --fg: #f7f6f2; --fg-muted: #a29e94; --fg-subtle: #a29e94; --border: #2d2b27; --brand: #3b5bfd; --brand-hover: #2a45e0; --brand-fg: #ffffff; --brand-text: #8fa4ff; --brand-subtle: #1c2a6b; --brand-subtle-border: #2236b3; --success: #4ade80; --success-fg: #12110f; --success-subtle: #0b3d1f; --danger: #f87171; --danger-fg: #12110f; --danger-subtle: #4c0f0f; --warning: #fbbf24; --warning-fg: #12110f; --warning-subtle: #42250a; color-scheme: dark; }
    }
    body { font-family: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--fg); }
    pre, code { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>`;

/** Tailwind CDN plus a config that exposes the semantic palette as utilities. */
export const MCP_DOCS_TAILWIND = `<script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = ${JSON.stringify({ theme: { extend: { colors: TAILWIND_COLORS } } })};</script>
  ${MCP_DOCS_STYLE}`;

/**
 * Markdown -> HTML for loading content into the TipTap article editor.
 *
 * Line-based (not split on blank lines), so fenced blocks may contain blank
 * lines and keep their language tag; that is what lets smart blocks survive an
 * editor round trip (TipTap codeBlock -> turndown fenced ```lang).
 * Everything is HTML-escaped; only the tags produced here reach the editor.
 * Pipe tables become ```table smart blocks because StarterKit has no table node.
 */

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeUrl(url: string): string | null {
  const u = url.trim();
  return /^(https?:\/\/|\/|#|mailto:)/i.test(u) ? u : null;
}

/** Inline markdown on already-escaped text. */
function inline(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = safeUrl(url);
    return u ? `<img src="${u}" alt="${alt}" />` : m;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const u = safeUrl(url);
    return u ? `<a href="${u}">${label}</a>` : m;
  });
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return s;
}

const isTableDivider = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);

export function markdownToEditorHtml(markdown: string): string {
  if (!markdown) return "";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];

  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br />")}</p>`);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith("```")) {
      flush();
      const lang = t.slice(3).trim().split(/\s+/)[0] ?? "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i++]);
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }
    if (!t) {
      flush();
      continue;
    }
    const h = t.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flush();
      out.push("<hr />");
      continue;
    }
    if (t.startsWith("|") && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim());
      i--;
      out.push(`<pre><code class="language-table">${escapeHtml(rows.join("\n"))}</code></pre>`);
      continue;
    }
    if (t.startsWith(">")) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) q.push(lines[i++].trim().replace(/^>\s?/, ""));
      i--;
      out.push(`<blockquote><p>${q.map(inline).join("<br />")}</p></blockquote>`);
      continue;
    }
    const img = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      flush();
      const u = safeUrl(img[2]);
      if (u) out.push(`<img src="${u}" alt="${escapeHtml(img[1])}" />`);
      continue;
    }
    if (/^[-*+]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
      flush();
      const ordered = /^\d+[.)]\s+/.test(t);
      const re = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i].trim())) items.push(lines[i++].trim().replace(re, ""));
      i--;
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((it) => `<li><p>${inline(it)}</p></li>`).join("")}</${tag}>`);
      continue;
    }
    para.push(t);
  }
  flush();
  return out.join("");
}

/** Heuristic: does pasted plain text look like Markdown worth converting? */
export function looksLikeMarkdown(text: string): boolean {
  if (!text.includes("\n")) return false;
  const signals = [
    /^#{1,3}\s+\S/m,
    /^\s*[-*]\s+\S/m,
    /^\s*\d+[.)]\s+\S/m,
    /^\|.+\|\s*$/m,
    /^```/m,
    /\*\*[^*]+\*\*/,
    /^>\s+\S/m,
  ];
  return signals.filter((r) => r.test(text)).length >= 2 || /^```|^\|.+\|\s*$/m.test(text);
}

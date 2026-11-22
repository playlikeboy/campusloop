// Renders CampusLoop's OG cards, PWA icons and manifest screenshots from HTML.
// Usage: node scripts/brand-assets/render.mjs
// Needs Chromium (CHROMIUM_PATH, defaults to ~/.local/bin/chromium) and ffmpeg.
// Look and screens come from scripts/launch-video (same fonts, colours, captures).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LV = join(ROOT, "scripts/launch-video/assets");
const PUB = join(ROOT, "public");
const fontsCss = readFileSync(join(LV, "fonts.css"), "utf8").replaceAll(
  "url(fonts/",
  `url(${pathToFileURL(join(LV, "fonts")).href}/`
);
const logoSvg = readFileSync(join(LV, "logo.svg"), "utf8");
const shot = (name) => pathToFileURL(join(LV, "shots", name)).href;

const BASE_CSS = `${fontsCss}
:root{--violet:#6b3df5;--violet-deep:#5a2be0;--mist:#f2edff;--yellow:#ffd43b;--pink:#d92a6a;--mint:#3ddc97;
--ink:#15131d;--ink-muted:#57526a;--hair:#e2deec;
--sticker:0 6px 16px -6px rgb(21 19 29/.26),0 2px 4px -1px rgb(21 19 29/.08);
--lift:0 18px 40px -12px rgb(21 19 29/.34),0 4px 10px -2px rgb(21 19 29/.12);}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Figtree,system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;overflow:hidden}
.disp{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:800;font-stretch:88%;letter-spacing:-.025em;line-height:.98}
.hl{display:inline-block;background:var(--violet);color:#fff;border-radius:.18em;padding:.03em .2em .09em;box-shadow:var(--lift);transform:rotate(-1.5deg)}
.stk{position:absolute;display:inline-flex;align-items:center;gap:.4em;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-stretch:82%;
letter-spacing:-.02em;line-height:1;padding:.5em .85em .55em;border-radius:999px;background:#fff;color:var(--ink);box-shadow:var(--sticker);white-space:nowrap}
.logo{display:flex;align-items:center;gap:14px}
.logo i{display:block;width:64px;height:64px;margin:-6px}
.logo b{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-stretch:88%;font-size:34px;letter-spacing:-.02em}
.phone{position:absolute;border-radius:46px;background:#15131d;padding:10px;box-shadow:0 60px 120px -40px rgb(21 19 29/.55),0 20px 40px -20px rgb(21 19 29/.3)}
.phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:37px}`;

const OG = [
  { file: "og-image.png", line1: "Your campus.", line2: "Only your campus.", sub: "Campus feed, events, free courses and PYQs, chat. Verified students only.", img: "m_feeds.jpg", tag: "1,442 colleges" },
  { file: "og-academics.png", line1: "Notes and PYQs", line2: "for your branch.", sub: "Free study material, previous-year papers and courses on CampusLoop.", img: "m_academics.jpg", tag: "Free" },
  { file: "og-articles.png", line1: "Guides by", line2: "students.", sub: "Read and write articles on code, college life and careers.", img: "m_courses.jpg", tag: "Learn" },
  { file: "og-colleges.png", line1: "Find your", line2: "college.", sub: "1,442 Indian colleges, each with its own verified campus space.", img: "m_feeds.jpg", tag: "1,442 colleges" },
  { file: "og-communities.png", line1: "Your clubs,", line2: "in one place.", sub: "Join communities and group chats at your college.", img: "m_board.jpg", tag: "Communities" },
  { file: "og-confessions.png", line1: "Say it", line2: "anonymously.", sub: "Campus confessions, only for verified students at your college.", img: "m_confessions.jpg", tag: "Anonymous" },
  { file: "og-events.png", line1: "Every fest and", line2: "hackathon.", sub: "Dates, deadlines and one-tap register for events near you.", img: "m_events.jpg", tag: "Events" },
  { file: "og-chat.png", line1: "Chat with", line2: "your batch.", sub: "Direct messages and group chats with verified students.", img: "m_chat.jpg", tag: "Chat" },
];

const ogHtml = (o) => `<!doctype html><style>${BASE_CSS}
body{width:1200px;height:630px;background:#fff;position:relative}
.bg{position:absolute;right:-120px;top:-160px;width:720px;height:720px;border-radius:50%;background:var(--mist)}
.l{position:absolute;left:72px;top:64px;width:660px}
h1{font-size:80px;margin-top:52px}
h1 .hl{margin-top:10px}
p{margin-top:30px;font-size:26px;line-height:1.35;color:var(--ink-muted);font-weight:500;max-width:600px}
.url{position:absolute;left:72px;bottom:44px;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-stretch:88%;font-size:28px;color:var(--violet)}
.phone{right:96px;top:60px;width:300px;height:640px;transform:rotate(4deg)}
.t1{right:330px;top:120px;font-size:24px;background:var(--yellow);transform:rotate(-6deg)}
.t2{right:56px;top:420px;font-size:22px;transform:rotate(5deg)}
</style><body><div class=bg></div>
<div class=l><div class=logo><i>${logoSvg}</i><b>CampusLoop</b></div>
<h1 class=disp>${o.line1}<br><span class=hl>${o.line2}</span></h1><p>${o.sub}</p></div>
<div class=url>campusloop.space</div>
<div class=phone><img src="${shot(o.img)}"></div>
<span class="stk t1">${o.tag}</span><span class="stk t2">✓ Verified students</span></body>`;

// Maskable: content inside the central 80% safe zone; solid violet so launchers can crop to any shape.
const iconHtml = (size, scale) => `<!doctype html><style>${BASE_CSS}
body{width:${size}px;height:${size}px;background:var(--violet);display:grid;place-items:center}
i{display:block;width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px;filter:brightness(0) invert(1)}
</style><body><i>${logoSvg}</i></body>`;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || join(homedir(), ".local/bin/chromium") });
async function render(html, w, h, out) {
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  // Load from a real file so file:// fonts and screenshots are allowed.
  const tmp = join(ROOT, "scripts/brand-assets/.render.html");
  writeFileSync(tmp, html);
  await pg.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  rmSync(tmp);
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: out });
  await pg.close();
  console.log("wrote", out.replace(`${ROOT}/`, ""));
}

for (const o of OG) await render(ogHtml(o), 1200, 630, join(PUB, o.file));
execFileSync("cp", [join(PUB, "og-image.png"), join(ROOT, "src/app/opengraph-image.png")]);

mkdirSync(join(PUB, "icons"), { recursive: true });
await render(iconHtml(512, 0.72), 512, 512, join(PUB, "icons/icon-maskable-512x512.png"));
await render(iconHtml(192, 0.72), 192, 192, join(PUB, "icons/icon-maskable-192x192.png"));
// iOS fills transparency with black, so the touch icon is opaque. iOS rounds the corners itself.
await render(iconHtml(180, 0.8), 180, 180, join(PUB, "apple-touch-icon.png"));
// Shortcut icons: violet tile with a white glyph, one per destination.
const glyph = {
  feed: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  post: '<path d="M12 5v14M5 12h14"/>',
  events: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
};
for (const [k, d] of Object.entries(glyph)) {
  await render(
    `<!doctype html><style>body{margin:0;width:96px;height:96px;background:#6b3df5;display:grid;place-items:center}</style><body><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg></body>`,
    96, 96, join(PUB, `icons/shortcut-${k}.png`)
  );
}
await b.close();

// Manifest screenshots (Chrome's richer install sheet): real 3x captures of the live app.
mkdirSync(join(PUB, "screenshots"), { recursive: true });
const ff = (src, out, vf) => {
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(LV, "shots", src), "-vf", vf, "-q:v", "4", join(PUB, "screenshots", out)]);
  console.log("wrote public/screenshots/" + out);
};
for (const n of ["feeds", "events", "academics", "chat"]) ff(`m_${n}.jpg`, `narrow-${n}.jpg`, "scale=780:1688");
for (const n of ["feeds", "events"]) ff(`d_${n}.jpg`, `wide-${n}.jpg`, "scale=1440:900");

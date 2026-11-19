// Render the six Instagram carousel slides (1080x1350 JPG, <=400 KB each).
// usage: node carousel.mjs <outdir>
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || 'ig';
const FFMPEG = process.env.FFMPEG || '/home/kunalkashyap8024/.local/bin/ffmpeg';
fs.mkdirSync(out, { recursive: true });
const names = ['hook', 'home', 'events', 'learn', 'chat-you', 'cta'];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/home/kunalkashyap8024/.local/bin/chromium' });
for (let i = 1; i <= 6; i++) {
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  pg.on('pageerror', (e) => console.error(e.message));
  await pg.goto(pathToFileURL(path.join(HERE, 'carousel.html')).href + '?slide=' + i);
  await pg.evaluate(() => window.__ready);
  const png = path.join(out, `_slide${i}.png`);
  await pg.screenshot({ path: png });
  const jpg = path.join(out, `campusloop-${i}-${names[i - 1]}.jpg`);
  for (const q of [2, 3, 4, 5, 6, 8]) {
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=1080:1350:flags=lanczos', '-q:v', String(q), jpg]);
    if (fs.statSync(jpg).size <= 400 * 1024) break;
  }
  fs.unlinkSync(png);
  console.log(jpg, Math.round(fs.statSync(jpg).size / 1024) + ' KB');
  await pg.close();
}
await b.close();

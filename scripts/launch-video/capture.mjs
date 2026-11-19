// Capture clean app screenshots of the live site for the launch film.
// Usage: node scripts/launch-video/capture.mjs
// Writes JPGs to scripts/launch-video/assets/shots/.
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'assets', 'shots');
const BASE = process.env.BASE || 'https://campusloop.space';
const CHROMIUM = process.env.CHROMIUM || '/home/kunalkashyap8024/.local/bin/chromium';
const EMAIL = process.env.DEMO_EMAIL || 'demo@campusloop.space';
const PASS = process.env.DEMO_PASS || 'CampusLoop@2026!';

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // e.g. "m:/courses,d:/feeds"
const keep = (k, r) => !ONLY || ONLY.includes(`${k}:${r}`);
const MOBILE = ['/feeds', '/confessions', '/events', '/courses', '/academics', '/chat', '/profile', '/streaks', '/board', '/crush', '/download'];
const MOBILE_TALL = ['/feeds', '/events', '/courses'];
const DESKTOP = ['/feeds', '/events', '/courses'];

const hideNotifPrompt = () => {
  try { localStorage.setItem('campusloop_notif_prompted_v1', 'true'); } catch {}
};
async function scrub(pg) {
  await pg.evaluate(() => {
    for (const el of document.querySelectorAll('div,section,aside')) {
      const t = el.innerText || '';
      if (t.startsWith('Turn on notifications?') && t.length < 200) {
        let n = el; // climb to the fixed container
        while (n.parentElement && getComputedStyle(n).position !== 'fixed') n = n.parentElement;
        (getComputedStyle(n).position === 'fixed' ? n : el).remove();
      }
    }
    // hide toasts / install banners that are not part of the screen
    document.querySelectorAll('[data-sonner-toaster]').forEach((e) => e.remove());
  });
}
async function login(ctx) {
  const pg = await ctx.newPage();
  await pg.goto(BASE + '/sign-in', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(4000);
  await pg.locator('button', { hasText: /^Email & Password$/ }).first().click();
  await pg.waitForTimeout(800);
  await pg.locator('input[type=email]').first().fill(EMAIL);
  await pg.locator('input[type=password]').first().fill(PASS);
  await pg.locator('button[type=submit]').first().click();
  await pg.waitForURL((u) => !u.toString().includes('sign-in'), { timeout: 45000 });
  return pg;
}
async function shoot(pg, route, file, full = false) {
  await pg.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(Number(process.env.WAIT || 9000));
  await scrub(pg);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 88, fullPage: false, ...(full ? { clip: { x: 0, y: 0, width: pg.viewportSize().width, height: Math.min(2400, await pg.evaluate(() => document.documentElement.scrollHeight)) }, fullPage: true } : {}) });
  console.log('shot', route, '->', file, pg.url().replace(BASE, ''));
}

const b = await chromium.launch({ executablePath: CHROMIUM });
const name = (r) => r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';

const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await m.addInitScript(hideNotifPrompt);
const mp = await login(m);
for (const r of MOBILE.filter((r) => keep('m', r))) await shoot(mp, r, `m_${name(r)}.jpg`);
for (const r of MOBILE_TALL.filter((r) => keep('mt', r))) await shoot(mp, r, `mt_${name(r)}.jpg`, true);

const d = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await d.addInitScript(hideNotifPrompt);
const dp = await login(d);
for (const r of DESKTOP.filter((r) => keep('d', r))) await shoot(dp, r, `d_${name(r)}.jpg`);
await b.close();

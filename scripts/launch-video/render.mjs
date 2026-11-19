// Deterministic frame renderer: loads film.html, seeks the paused GSAP timeline per frame,
// screenshots at 2x and pipes frames to ffmpeg (downscaled with lanczos for clean edges).
//
//   node render.mjs --v h --out /tmp/x/video_h.mp4            full render (intermediate, near-lossless)
//   node render.mjs --v v --stills 1,12,30 --stills-dir /tmp/x  PNG stills only
//   node render.mjs --dump /tmp/x/film.json                     cues + captions for music/VTT
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') ? [...a, [x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : a), []));
const CHROMIUM = process.env.CHROMIUM || '/home/kunalkashyap8024/.local/bin/chromium';
const FFMPEG = process.env.FFMPEG || '/home/kunalkashyap8024/.local/bin/ffmpeg';
const V = args.v || 'h';
const FPS = Number(args.fps || 60);
const SS = Number(args.ss || 2); // supersampling
const WORKERS = Number(args.workers || 12);
const PAGE = args.page || 'film.html';
const url = pathToFileURL(path.join(HERE, PAGE)).href + `?v=${V}`;

async function openPage(browser, W, H) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SS });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => console.error('pageerror', e.message));
  await pg.goto(url, { waitUntil: 'load' });
  await pg.evaluate(() => window.__ready);
  return pg;
}
const launch = () => chromium.launch({ executablePath: CHROMIUM, args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--hide-scrollbars'] });

const b0 = await launch();
const W = V === 'v' ? 1080 : 1920, H = V === 'v' ? 1920 : 1080;
const p0 = await openPage(b0, W, H);
const film = await p0.evaluate(() => ({ duration: FILM.duration, cues: FILM.cues, caps: FILM.caps }));

if (args.dump) {
  fs.writeFileSync(args.dump, JSON.stringify(film, null, 1));
  console.log('wrote', args.dump, film.cues.length, 'cues', film.caps.length, 'captions');
}
if (args.stills) {
  const dir = args['stills-dir'] || '.';
  fs.mkdirSync(dir, { recursive: true });
  const ts = String(args.stills).split(',').map(Number).sort((a, b) => a - b);
  for (const t of ts) {
    await p0.evaluate((t) => window.seek(t), t);
    const f = path.join(dir, `still_${V}_${t.toFixed(2).padStart(5, "0")}.png`);
    await p0.screenshot({ path: f, scale: 'css' });
    console.log('still', f);
  }
}
await b0.close();
if (!args.out) process.exit(0);

const N = Math.round(film.duration * FPS);
const per = Math.ceil(N / WORKERS);
const tmp = path.join(path.dirname(args.out), `seg_${V}`);
fs.mkdirSync(tmp, { recursive: true });
const t0 = Date.now();
let done = 0;
async function worker(k) {
  const a = k * per, z = Math.min(N, a + per);
  if (a >= z) return null;
  const seg = path.join(tmp, `seg_${String(k).padStart(2, '0')}.mp4`);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${W}:${H}:flags=lanczos:in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv444p`,
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '6', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const br = await launch();
  const pg = await openPage(br, W, H);
  for (let i = a; i < z; i++) {
    await pg.evaluate((t) => window.seek(t), i / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 300 === 0) console.log(`${V}: ${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await br.close();
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
  return seg;
}
const segs = (await Promise.all([...Array(WORKERS).keys()].map(worker))).filter(Boolean);
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
await new Promise((r, j) => spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', args.out], { stdio: 'inherit' }).on('close', (c) => (c ? j(new Error('concat ' + c)) : r())));
console.log(`${V}: rendered ${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${args.out}`);

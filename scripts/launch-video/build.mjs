// One-command build of the CampusLoop launch film.
//   node scripts/launch-video/build.mjs [--capture] [--only h|v] [--carousel <dir>] [--skip-render]
// Intermediates go to $WORK (default: <os tmp>/campusloop-launch). Outputs go to public/launch/.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(ROOT, 'public', 'launch');
const WORK = process.env.WORK || path.join(os.tmpdir(), 'campusloop-launch');
const FFMPEG = process.env.FFMPEG || '/home/kunalkashyap8024/.local/bin/ffmpeg';
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
const VERSIONS = val('--only') ? [val('--only')] : ['h', 'v'];
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(WORK, { recursive: true });

const run = (cmd, args, opts = {}) => { console.log('>', cmd, args.join(' ').slice(0, 160)); return execFileSync(cmd, args, { stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', cwd: HERE, maxBuffer: 1 << 26 }); };
const ff = (args) => run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args]);
const MB = (f) => fs.statSync(f).size / 1048576;

if (flag('--capture')) run('node', ['capture.mjs']);

// 1. cues + captions, frames
const filmJson = path.join(WORK, 'film.json');
run('node', ['render.mjs', '--v', 'h', '--dump', filmJson]);
if (!flag('--skip-render')) for (const v of VERSIONS) run('node', ['render.mjs', '--v', v, '--out', path.join(WORK, `video_${v}.mp4`)]);

// 2. music: synth, then two-pass loudnorm to -14 LUFS / -1.5 dBTP
const raw = path.join(WORK, 'music_raw.wav');
const music = path.join(WORK, 'music.wav');
run('python3', ['music.py', filmJson, raw]);
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
let stats;
{
  const r = execFileSync('bash', ['-c', `"${FFMPEG}" -hide_banner -i "${raw}" -af ${LN}:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`]);
  stats = JSON.parse(String(r));
}
ff(['-i', raw, '-af', `${LN}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`, '-ar', '48000', music]);

// 3. final encodes, stepping CRF up until the file fits the size target
const film = JSON.parse(fs.readFileSync(filmJson, 'utf8'));
for (const v of VERSIONS) {
  const src = path.join(WORK, `video_${v}.mp4`);
  const dst = path.join(OUT, v === 'h' ? 'campusloop-launch.mp4' : 'campusloop-launch-vertical.mp4');
  for (const crf of [21, 23, 25, 27, 29]) {
    ff(['-i', src, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-x264-params', 'keyint=120:min-keyint=30', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-t', String(film.duration), dst]);
    console.log(`${path.basename(dst)} crf ${crf}: ${MB(dst).toFixed(2)} MB`);
    if (MB(dst) <= 15) break;
  }
  // poster from the end card
  const poster = path.join(OUT, v === 'h' ? 'poster.jpg' : 'poster-vertical.jpg');
  for (const q of [2, 3, 4, 5, 6, 8, 10]) {
    ff(['-ss', '52.5', '-i', src, '-frames:v', '1', '-q:v', String(q), poster]);
    if (fs.statSync(poster).size <= 200 * 1024) break;
  }
}

// 4. captions
const ts = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), mi = Math.floor(ms / 60000) % 60, se = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(se).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
const vtt = ['WEBVTT', '', ...film.caps.sort((a, b) => a.start - b.start).flatMap((c, i) => [String(i + 1), `${ts(c.start)} --> ${ts(c.end)}`, c.text, ''])].join('\n');
fs.writeFileSync(path.join(OUT, 'campusloop-launch.vtt'), vtt);

if (val('--carousel')) run('node', ['carousel.mjs', val('--carousel')]);
for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(36), (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0).padStart(7), 'KB');

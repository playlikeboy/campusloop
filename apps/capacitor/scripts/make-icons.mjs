// Regenerates the CampusLoop Web launcher icons, adaptive icon layers and
// splash images in android/app/src/main/res from the CampusLoop "C" in
// ../../public/favicon.svg. Same approach as apps/mobile/scripts/make-icons.mjs.
// Run from the repo root, which already has sharp installed:
//   node apps/capacitor/scripts/make-icons.mjs
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const require = createRequire(join(repoRoot, "package.json"));
const sharp = require("sharp");

const VIOLET = "#6b3df5"; // DESIGN.md loop-violet
const PAPER = "#ffffff"; // DESIGN.md paper
const res = join(here, "..", "android", "app", "src", "main", "res");

const svgSource = readFileSync(join(repoRoot, "public", "favicon.svg"), "utf8");
const pathD = svgSource.match(/ d="([^"]+)"/)[1];
// Bounding box of the C path in its 1024 viewBox.
const BOX = { x: 288, y: 258, w: 436, h: 462 };

/** The C centred on a w x h canvas, scaled so its height is `scale` of the shorter side. */
function markSvg({ width, height = width, scale, fill, background, round = false }) {
  const side = Math.min(width, height);
  const k = (side * scale) / BOX.h;
  const tx = (width - BOX.w * k) / 2 - BOX.x * k;
  const ty = (height - BOX.h * k) / 2 - BOX.y * k;
  let bg = "";
  if (background && round) bg = `<circle cx="${width / 2}" cy="${height / 2}" r="${side / 2}" fill="${background}"/>`;
  else if (background) bg = `<rect width="${width}" height="${height}" fill="${background}"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}` +
      `<path transform="translate(${tx} ${ty}) scale(${k})" d="${pathD}" fill="${fill}"/></svg>`
  );
}

async function write(rel, opts) {
  const file = join(res, rel);
  mkdirSync(dirname(file), { recursive: true });
  await sharp(markSvg(opts)).png().toFile(file);
  console.log("wrote", rel);
}

// Launcher icons: legacy square, legacy round, adaptive foreground (108dp canvas) and monochrome.
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, d] of Object.entries(DENSITIES)) {
  const legacy = Math.round(48 * d);
  const adaptive = Math.round(108 * d);
  await write(`mipmap-${name}/ic_launcher.png`, { width: legacy, scale: 0.56, fill: VIOLET, background: PAPER });
  await write(`mipmap-${name}/ic_launcher_round.png`, {
    width: legacy,
    scale: 0.5,
    fill: VIOLET,
    background: PAPER,
    round: true,
  });
  await write(`mipmap-${name}/ic_launcher_foreground.png`, { width: adaptive, scale: 0.4, fill: VIOLET });
  await write(`mipmap-${name}/ic_launcher_monochrome.png`, { width: adaptive, scale: 0.4, fill: "#000000" });
}

// Splash: the C on paper, for the legacy (pre Android 12) launch background.
const SPLASH = {
  "drawable": [480, 320],
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [960, 1600],
  "drawable-port-xxxhdpi": [1280, 1920],
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1600, 960],
  "drawable-land-xxxhdpi": [1920, 1280],
};
for (const [dir, [width, height]] of Object.entries(SPLASH)) {
  await write(`${dir}/splash.png`, { width, height, scale: 0.22, fill: VIOLET, background: PAPER });
}

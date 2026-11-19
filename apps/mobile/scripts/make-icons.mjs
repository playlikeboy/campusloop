// Regenerates the app icon, adaptive icon layers and splash mark from the
// CampusLoop "C" in ../../public/favicon.svg. Run from the repo root, which
// already has sharp installed:  node apps/mobile/scripts/make-icons.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const require = createRequire(join(repoRoot, "package.json"));
const sharp = require("sharp");

const VIOLET = "#6b3df5"; // DESIGN.md loop-violet
const PAPER = "#ffffff"; // DESIGN.md paper
const out = join(here, "..", "assets", "images");

const svgSource = readFileSync(join(repoRoot, "public", "favicon.svg"), "utf8");
const pathD = svgSource.match(/ d="([^"]+)"/)[1];
// Bounding box of the C path in its 1024 viewBox.
const BOX = { x: 288, y: 258, w: 436, h: 462 };

/** The C centred on a square canvas, scaled so its height is `scale` of the canvas. */
function markSvg({ size, scale, fill, background }) {
  const k = (size * scale) / BOX.h;
  const tx = (size - BOX.w * k) / 2 - BOX.x * k;
  const ty = (size - BOX.h * k) / 2 - BOX.y * k;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : "";
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}` +
      `<path transform="translate(${tx} ${ty}) scale(${k})" d="${pathD}" fill="${fill}"/></svg>`
  );
}

const jobs = [
  ["icon.png", { size: 1024, scale: 0.56, fill: VIOLET, background: PAPER }],
  ["android-icon-foreground.png", { size: 1024, scale: 0.4, fill: VIOLET }],
  ["android-icon-background.png", { size: 1024, scale: 0, fill: PAPER, background: PAPER }],
  ["android-icon-monochrome.png", { size: 1024, scale: 0.4, fill: "#000000" }],
  ["splash-icon.png", { size: 512, scale: 0.9, fill: VIOLET }],
  ["favicon.png", { size: 48, scale: 0.7, fill: VIOLET, background: PAPER }],
];

for (const [name, opts] of jobs) {
  await sharp(markSvg(opts)).png().toFile(join(out, name));
  console.log("wrote", name);
}

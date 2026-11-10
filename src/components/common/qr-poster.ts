/**
 * Draws the downloadable QR poster: a violet story field with a white QR sticker.
 * The PNG is shared outside the app, so it uses a fixed palette instead of theme tokens.
 */
const POSTER = {
  field: "#6B3DF5", // ds-allow: exported PNG, fixed brand violet
  ink: "#15131D", // ds-allow: exported PNG, fixed ink
  white: "#FFFFFF", // ds-allow: exported PNG, fixed white
  muted: "rgba(255, 255, 255, 0.78)",
  pill: "rgba(255, 255, 255, 0.16)",
  shadow: "rgba(21, 19, 29, 0.28)",
} as const;

const FONT = "Figtree, system-ui, sans-serif";
const DISPLAY = "'Bricolage Grotesque', Figtree, system-ui, sans-serif";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function drawQrPoster({
  qrDataUrl,
  title,
  subtitle,
  badgeText,
  displayUrl,
}: {
  qrDataUrl: string;
  title: string;
  subtitle?: string;
  badgeText: string;
  displayUrl: string;
}): Promise<Blob> {
  const width = 800;
  const height = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.fillStyle = POSTER.field;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";

  ctx.fillStyle = POSTER.white;
  ctx.font = `800 34px ${DISPLAY}`;
  ctx.fillText("CampusLoop", width / 2, 84);

  ctx.font = `600 16px ${FONT}`;
  const badgeW = Math.min(ctx.measureText(badgeText).width + 40, 560);
  ctx.fillStyle = POSTER.pill;
  ctx.beginPath();
  ctx.roundRect((width - badgeW) / 2, 108, badgeW, 36, 18);
  ctx.fill();
  ctx.fillStyle = POSTER.white;
  ctx.fillText(badgeText, width / 2, 132);

  ctx.font = `800 40px ${DISPLAY}`;
  ctx.fillText(truncate(title, 30), width / 2, 208);

  if (subtitle) {
    ctx.fillStyle = POSTER.muted;
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText(truncate(subtitle, 44), width / 2, 246);
  }

  // White QR sticker, slightly tilted, with an offset lift shadow.
  const box = 440;
  const boxX = (width - box) / 2;
  const boxY = 296;
  ctx.save();
  ctx.translate(width / 2, boxY + box / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.translate(-width / 2, -(boxY + box / 2));
  ctx.shadowColor = POSTER.shadow;
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = POSTER.white;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, box, box, 32);
  ctx.fill();
  ctx.shadowColor = "transparent";
  const qrImg = await loadImage(qrDataUrl);
  const pad = 30;
  ctx.drawImage(qrImg, boxX + pad, boxY + pad, box - pad * 2, box - pad * 2);
  ctx.restore();

  const pillW = 460;
  const pillY = 790;
  ctx.fillStyle = POSTER.white;
  ctx.beginPath();
  ctx.roundRect((width - pillW) / 2, pillY, pillW, 56, 28);
  ctx.fill();
  ctx.fillStyle = POSTER.ink;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText(truncate(displayUrl, 38), width / 2, pillY + 36);

  ctx.fillStyle = POSTER.muted;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText("Scan with your phone camera", width / 2, 910);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) throw new Error("Could not create the image");
  return blob;
}

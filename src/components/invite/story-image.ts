/**
 * Draws a 1080x1920 invite card for an Instagram story, using the live design
 * tokens so the image matches the app in both themes' brand colours.
 */
function token(name: string, fallbackVar: string): string {
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(name).trim() || styles.getPropertyValue(fallbackVar).trim();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildInviteStoryImage({
  name,
  college,
  link,
}: {
  name: string;
  college: string | null;
  link: string;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const field = token("--color-story-field", "--color-brand");
  const fieldFg = token("--color-story-field-fg", "--color-brand-fg");
  const sticker = token("--color-sticker", "--color-surface");
  const stickerFg = token("--color-sticker-fg", "--color-fg");
  const brandText = token("--color-brand-text", "--color-brand");
  const display = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "sans-serif";

  ctx.fillStyle = field;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = fieldFg;
  ctx.font = `800 120px ${display}`;
  const headline = college ? `${college} is on CampusLoop` : "Your college is on CampusLoop";
  let y = 420;
  for (const line of wrap(ctx, headline, 900)) {
    ctx.fillText(line, 90, y);
    y += 128;
  }

  // The tilted white sticker with the ask.
  ctx.save();
  ctx.translate(540, y + 260);
  ctx.rotate(-0.05);
  ctx.fillStyle = sticker;
  ctx.beginPath();
  ctx.roundRect(-450, -170, 900, 340, 44);
  ctx.fill();
  ctx.fillStyle = brandText;
  ctx.font = `800 76px ${display}`;
  ctx.textAlign = "center";
  ctx.fillText(`Join ${name.split(" ")[0]}`, 0, -30);
  ctx.fillStyle = stickerFg;
  ctx.font = `600 46px ${display}`;
  ctx.fillText("Students only. +50 Loop Points", 0, 60);
  ctx.restore();

  ctx.fillStyle = fieldFg;
  ctx.font = `600 44px ${display}`;
  ctx.textAlign = "center";
  ctx.fillText(link.replace(/^https?:\/\//, ""), 540, 1700);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

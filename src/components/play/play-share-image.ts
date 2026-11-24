/**
 * Draws a 1080x1920 story image for a Play badge or score, using the live
 * design tokens (same approach as src/components/invite/story-image.ts), and
 * shares it as a file with a download fallback.
 */
import { toast } from "sonner";

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

/** Five-point star, used as the badge mark. */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export interface PlayShareContent {
  /** Small line above the title, e.g. "Badge unlocked". */
  kicker: string;
  /** The big words, e.g. "Meme War winner". */
  title: string;
  /** One line under the title, e.g. "Had the top meme on campus for a week". */
  detail: string;
  name: string;
  college: string | null;
}

export async function buildPlayShareImage(c: PlayShareContent): Promise<Blob | null> {
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
  const reward = token("--color-reward", "--color-brand");
  const rewardFg = token("--color-reward-fg", "--color-fg");
  const display = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "sans-serif";

  ctx.fillStyle = field;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = fieldFg;
  ctx.font = `700 52px ${display}`;
  ctx.fillText(c.kicker, 540, 300);

  // Badge mark: a yellow reward disc with a star.
  ctx.fillStyle = reward;
  ctx.beginPath();
  ctx.arc(540, 560, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rewardFg;
  star(ctx, 540, 570, 120, 52);
  ctx.fill();

  // The tilted sticker with the title and detail.
  ctx.font = `800 96px ${display}`;
  const titleLines = wrap(ctx, c.title, 780).slice(0, 3);
  ctx.font = `600 46px ${display}`;
  const detailLines = wrap(ctx, c.detail, 780).slice(0, 3);
  const height = 120 + titleLines.length * 104 + detailLines.length * 60;

  ctx.save();
  ctx.translate(540, 1080);
  ctx.rotate(-0.035);
  ctx.fillStyle = sticker;
  ctx.beginPath();
  ctx.roundRect(-460, -height / 2, 920, height, 48);
  ctx.fill();
  let y = -height / 2 + 120;
  ctx.fillStyle = brandText;
  ctx.font = `800 96px ${display}`;
  for (const line of titleLines) {
    ctx.fillText(line, 0, y);
    y += 104;
  }
  ctx.fillStyle = stickerFg;
  ctx.font = `600 46px ${display}`;
  for (const line of detailLines) {
    ctx.fillText(line, 0, y - 20);
    y += 60;
  }
  ctx.restore();

  ctx.fillStyle = fieldFg;
  ctx.font = `700 56px ${display}`;
  ctx.fillText(c.name, 540, 1460);
  if (c.college) {
    ctx.font = `500 42px ${display}`;
    for (const [i, line] of wrap(ctx, c.college, 900).slice(0, 2).entries()) ctx.fillText(line, 540, 1530 + i * 54);
  }

  ctx.font = `600 44px ${display}`;
  ctx.fillText("Play on CampusLoop  ·  campusloop.space/play", 540, 1780);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Shares the image through the phone share sheet, or downloads it where files can't be shared. */
export async function sharePlayImage(content: PlayShareContent, fileName: string): Promise<void> {
  const blob = await buildPlayShareImage(content);
  if (!blob) {
    toast.error("Couldn't make the image on this device.");
    return;
  }
  const file = new File([blob], fileName, { type: "image/png" });
  const text = `${content.title} on CampusLoop Play. campusloop.space/play`;
  try {
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return;
    }
  } catch (e) {
    // Closing the share sheet is not an error.
    if (e instanceof DOMException && e.name === "AbortError") return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("Image saved. Post it to your story.");
}

import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowBigUp, BarChart3, Flame, MessageCircle, VenetianMask } from "lucide-react";
import styles from "./campusloop-homepage-refresh.module.css";

const POLL_OPTIONS = [
  { label: "Maggi point by the gate", pct: 46 },
  { label: "Night canteen", pct: 31 },
  { label: "Order in, obviously", pct: 23 },
];

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const DONE_DAYS = 5;

/** Illustrative feed composite for the hero. Content is example copy, labelled as such. */
export function LandingFeedPreview() {
  return (
    <figure className={styles.preview}>
      <div className={styles.previewArt}>
        <Image
          src="/campusloop/marketing/voxel/colleges.webp"
          alt=""
          fill priority sizes="(max-width: 900px) 100vw, 52vw"
          className={styles.previewImage}
        />
      </div>

      <div className={styles.previewStack}>
        <article className={styles.post} aria-label="Example confession">
          <header className={styles.postHead}>
            <span className={`${styles.postAvatar} ${styles.avatarBlush}`}><VenetianMask size={17} aria-hidden="true" /></span>
            <span><strong>Anonymous</strong><small>Confession · 2nd year</small></span>
          </header>
          <p>Whoever leaves the spare chai flask outside the library during exams: you are the reason I survived DSA.</p>
          <footer className={styles.postActions} aria-hidden="true">
            <span><ArrowBigUp size={16} /> Upvote</span>
            <span><MessageCircle size={15} /> Reply</span>
          </footer>
        </article>

        <article className={`${styles.post} ${styles.poll}`} aria-label="Example campus poll">
          <header className={styles.postHead}>
            <span className={`${styles.postAvatar} ${styles.avatarBlue}`}><BarChart3 size={16} aria-hidden="true" /></span>
            <span><strong>Best late-night food near campus?</strong><small>Poll · closes tonight</small></span>
          </header>
          <ul className={styles.pollOptions}>
            {POLL_OPTIONS.map((option, index) => (
              <li key={option.label} style={{ "--pct": `${option.pct}%`, "--i": index } as CSSProperties}>
                <span>{option.label}</span><b>{option.pct}%</b>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${styles.post} ${styles.streakCard}`} aria-label="Example streak tracker">
          <span className={styles.flame}><Flame size={20} aria-hidden="true" /></span>
          <span className={styles.streakCopy}><strong>12-day run</strong><small>Your streak is safe today</small></span>
          <ol className={styles.weekDots} aria-label={`${DONE_DAYS} of 7 days this week`}>
            {WEEK.map((day, index) => (
              <li key={index} data-done={index < DONE_DAYS || undefined} data-today={index === DONE_DAYS - 1 || undefined} style={{ "--i": index } as CSSProperties}>
                {day}
              </li>
            ))}
          </ol>
        </article>
      </div>

      <figcaption className={styles.previewCaption}>Example posts</figcaption>
    </figure>
  );
}

import { BarChart3, BookOpen, CalendarCheck, Flame, MessageCircle, PenLine, Users } from "lucide-react";
import styles from "./campusloop-homepage-refresh.module.css";

const ACTIONS = [
  { icon: PenLine, label: "Post, confess, or start a poll" },
  { icon: BarChart3, label: "Vote in a campus poll" },
  { icon: MessageCircle, label: "Answer someone’s question" },
  { icon: BookOpen, label: "Share notes or PYQs" },
  { icon: Users, label: "Join a club or community" },
  { icon: CalendarCheck, label: "RSVP to a fest or hackathon" },
];

// Mirrors the milestone table in PRODUCT.md (streak engine).
const MILESTONES = [
  { days: 3, lp: 15 },
  { days: 7, lp: 25 },
  { days: 14, lp: 50 },
  { days: 30, lp: 100 },
  { days: 100, lp: 250 },
];

export function LandingStreakSection() {
  return (
    <section className={styles.streaks} id="streaks" aria-labelledby="streaks-title">
      <div className={styles.streaksCopy}>
        <h2 id="streaks-title">One meaningful thing a day keeps your loop alive.</h2>
        <p>
          No endless scrolling to stay relevant. Do one real thing on campus each day and your streak grows.
          Miss a day and you simply start a new run. No guilt trips.
        </p>
        <ul className={styles.actionList} aria-label="Actions that count toward your streak">
          {ACTIONS.map(({ icon: Icon, label }) => (
            <li key={label}><Icon size={17} aria-hidden="true" />{label}</li>
          ))}
        </ul>
        <p className={styles.fineNote}>Opening the app or scrolling doesn’t count. Showing up does.</p>
      </div>

      <div className={styles.ladder}>
        <p className={styles.ladderTitle}><Flame size={18} aria-hidden="true" /> Milestones earn Loop Points</p>
        <ol>
          {MILESTONES.map((milestone) => (
            <li key={milestone.days}>
              <span className={styles.ladderDays}><b>{milestone.days}</b> days</span>
              <span className={styles.ladderLine} aria-hidden="true" />
              <span className={styles.ladderLp}>+{milestone.lp} LP</span>
            </li>
          ))}
        </ol>
        <p className={styles.ladderFoot}>All the way to a full year: +1000 LP at 365 days.</p>
      </div>
    </section>
  );
}

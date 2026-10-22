import { ArrowRight, Award, Clock, Languages, ListChecks, NotebookPen, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/db/schema";
import { formatDuration } from "@/lib/courses/format";
import styles from "./campusloop-homepage-refresh.module.css";

const PROVIDERS = ["Harvard CS50", "MIT OpenCourseWare", "Stanford", "NPTEL (IITs)", "CodeWithHarry", "Gate Smashers", "Neso Academy", "CampusX", "Apna College", "Striver"];

const PERKS = [
  { icon: ListChecks, label: "Progress saved lecture by lecture" },
  { icon: NotebookPen, label: "Timestamped notes and Q&A" },
  { icon: Award, label: "Certificate when you finish" },
  { icon: Languages, label: "English and Hindi courses" },
];

/** Landing: the free courses pitch with real catalog picks. `courses` may be empty if the catalog is unreachable. */
export function LandingCoursesSection({ courses, total }: { courses: Course[]; total: number }) {
  return (
    <section className={styles.courses} id="courses" aria-labelledby="courses-title">
      <div className={styles.coursesCopy}>
        <p className={styles.eyebrow}>New: free courses</p>
        <h2 id="courses-title">Learn from Harvard, MIT and India’s favourite teachers. Free.</h2>
        <p>
          {total > 0 ? `${Math.floor(total / 50) * 50}+` : "Hundreds of"} full courses on DSA, DBMS, OS, web development, AI and more, in a focused player that remembers where you stopped.
        </p>
        <ul className={styles.providerList} aria-label="Course sources">
          {PROVIDERS.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <ul className={styles.perkList}>
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label}><Icon size={18} aria-hidden="true" />{label}</li>
          ))}
        </ul>
        <Link href="/courses" className={`${styles.button} ${styles.primaryButton} ${styles.coursesCta}`}>
          Browse free courses <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {courses.length > 0 && (
        <ul className={styles.courseShowcase} aria-label="Popular courses">
          {courses.slice(0, 4).map((c) => (
            <li key={c.id}>
              <Link href={`/courses/${c.slug}`} className={styles.courseTile}>
                <span className={styles.courseThumb}>
                  {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" loading="lazy" />}
                  <span className={styles.courseBadge}>{c.source === "CS50" ? "Harvard CS50" : (c.provider ?? c.instructorName)}</span>
                </span>
                <strong>{c.title}</strong>
                <small>
                  <PlayCircle size={14} aria-hidden="true" /> {c.lecturesCount} lectures
                  <Clock size={14} aria-hidden="true" /> {formatDuration(c.durationSec)}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

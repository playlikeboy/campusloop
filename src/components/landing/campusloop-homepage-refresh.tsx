import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Code2, GraduationCap, Heart, MessageCircle, Newspaper, ShieldCheck, ShoppingBag, Sparkles, Users } from "lucide-react";
import type { Course } from "@/db/schema";
import { LandingCoursesSection } from "./landing-courses-section";
import { LandingCollegeSearch } from "./landing-college-search";
import { LandingFeedPreview } from "./landing-feed-preview";
import { LandingStreakSection } from "./landing-streak-section";
import { LandingBrand, LandingHomeFooter } from "./landing-home-footer";
import styles from "./campusloop-homepage-refresh.module.css";

const QUICK_LINKS = [
  { href: "/feeds", icon: MessageCircle, title: "Campus feed", body: "Confessions, polls, and what’s happening today" },
  { href: "https://dsaloop.campusloop.space", icon: Code2, title: "DSALoop", body: "Coding interview patterns, 185+ company tracks & system design" },
  { href: "https://baby.campusloop.space", icon: Sparkles, title: "baby · AI Journal", body: "A quiet sanctuary for your thoughts and gentle reflections" },
  { href: "/dating", icon: Heart, title: "Campus Match", body: "Meet verified students, on your terms" },
  { href: "/colleges", icon: GraduationCap, title: "College hubs", body: "Your campus space, plus every other one" },
  { href: "/articles", icon: Newspaper, title: "Articles", body: "Guides and stories by students, with interactive charts and quizzes" },
  { href: "/marketplace", icon: ShoppingBag, title: "Campus marketplace", body: "Food, laundry, water and more from shops near your campus" },
  { href: "/courses/my", icon: BookOpen, title: "My learning", body: "Pick up any course exactly where you stopped" },
];

export const LANDING_FAQS = [
  ["Are the courses really free?", "Yes. Every course is free to watch, including Harvard CS50, MIT, Stanford and NPTEL courses and playlists from educators like CodeWithHarry and Gate Smashers. Sign in to save progress and earn a certificate."],
  ["Do I get a certificate?", "Yes. Finish every lecture of a course and you get a CampusLoop certificate with a public link you can add to LinkedIn. It is issued by CampusLoop, not by the university or creator."],
  ["Who can join CampusLoop?", "CampusLoop is for college students. Sign up with your institutional email or use the supported student-ID verification flow."],
  ["Is the Academic Vault free?", "Students can browse and access available peer-shared notes and previous-year question papers without a paywall."],
  ["What if my college isn’t listed?", "Search the college directory, and if your campus isn’t there yet, request a hub for your institution."],
];

export function CampusLoopHomepageRefresh({ courses = [], courseTotal = 0 }: { courses?: Course[]; courseTotal?: number }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <LandingBrand />
        <nav className={styles.navLinks} aria-label="Main navigation">
          <Link href="/courses">Free courses</Link>
          <Link href="#features">What’s inside</Link>
          <Link href="#streaks">Streaks</Link>
          <Link href="/colleges">Colleges</Link>
          <Link href="/guide">Guide</Link>
          <Link href="#faq">FAQ</Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/sign-in" className={styles.signIn}>Sign in</Link>
          <Link href="/sign-up" className={`${styles.button} ${styles.navButton}`}>Join free</Link>
        </div>
      </header>

      <main id="main-landing-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">All of college.<br /><span>One app.</span></h1>
            <p className={styles.heroDescription}>
              Free courses from Harvard, MIT and India’s best teachers. Notes and PYQs for your exams. And a campus feed only verified students can enter. All free.
            </p>
            <div className={styles.heroActions}>
              <Link href="/sign-up" className={`${styles.button} ${styles.primaryButton}`}>
                Join free with your college email <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/courses" className={styles.textLink}>Start a free course <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <ul className={styles.proofRow}>
              <li><ShieldCheck size={17} aria-hidden="true" /> Verified students only</li>
              <li><ShieldCheck size={17} aria-hidden="true" /> {courseTotal > 0 ? `${Math.floor(courseTotal / 50) * 50}+ free courses` : "Free courses"}</li>
              <li><ShieldCheck size={17} aria-hidden="true" /> 1,400+ colleges</li>
            </ul>
            <LandingCollegeSearch />
          </div>
          <LandingFeedPreview />
        </section>

        <LandingCoursesSection courses={courses} total={courseTotal} />

        <section className={styles.features} id="features" aria-labelledby="features-title">
          <div className={styles.sectionIntro}>
            <h2 id="features-title">Replace ten apps and twenty group chats.</h2>
            <p>Notes, people, clubs, food and gossip, in one place built only for students.</p>
          </div>

          <div className={styles.featureGrid}>
            <article className={`${styles.featureCard} ${styles.academicCard}`}>
              <div className={styles.featureCopy}>
                <span className={`${styles.featureIcon} ${styles.blueIcon}`}><BookOpen size={20} aria-hidden="true" /></span>
                <h3>That one note you really need.</h3>
                <p>Peer-shared notes, solved PYQs, and semester study material, free to browse.</p>
                <Link href="/academics" className={styles.textLink}>Explore the Academic Vault <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
              <div className={styles.featureImage}>
                <Image src="/campusloop/marketing/voxel/academics.webp" alt="Voxel-style dorm study desk with a laptop, books, and notes" fill sizes="(max-width: 900px) 100vw, 38vw" className={styles.cardImage} />
              </div>
            </article>

            <article className={`${styles.featureCard} ${styles.communityCard}`}>
              <div className={styles.communityImage}>
                <Image src="/campusloop/marketing/voxel/events.webp" alt="Voxel-style club fair with colorful stalls and students meeting outdoors" fill sizes="(max-width: 900px) 100vw, 36vw" className={styles.cardImage} />
              </div>
              <div className={styles.featureCopy}>
                <span className={`${styles.featureIcon} ${styles.peachIcon}`}><Users size={20} aria-hidden="true" /></span>
                <h3>There’s a group for your kind of people.</h3>
                <p>Clubs, teammates, and campus events, without digging through a dozen chats.</p>
                <Link href="/communities" className={styles.textLink}>Explore communities <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </article>
          </div>

          <ul className={styles.quickLinks}>
            {QUICK_LINKS.map(({ href, icon: Icon, title, body }) => (
              <li key={href}>
                {href.startsWith("http") ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <span className={styles.quickIcon}><Icon size={18} aria-hidden="true" /></span>
                    <span><strong>{title}</strong><small>{body}</small></span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <Link href={href}>
                    <span className={styles.quickIcon}><Icon size={18} aria-hidden="true" /></span>
                    <span><strong>{title}</strong><small>{body}</small></span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <LandingStreakSection />

        <section className={styles.trust} aria-labelledby="trust-title">
          <div className={styles.trustHeading}>
            <h2 id="trust-title">Made for students, not spectators.</h2>
            <p>Every account belongs to a verified student, so your campus space stays yours.</p>
            <Link href="/safety" className={styles.textLink}>How safety works <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <ol className={styles.steps}>
            <li><h3>Verify you’re a student</h3><p>Use your institutional email or the student-ID flow.</p></li>
            <li><h3>Find your college hub</h3><p>Start with the campus you know, then explore beyond it.</p></li>
            <li><h3>Join the conversation</h3><p>Share notes, find your crowd, and keep your loop going.</p></li>
          </ol>
        </section>

        <section className={styles.faqSection} id="faq" aria-labelledby="faq-title">
          <div className={styles.faqHeading}>
            <h2 id="faq-title">Before you join.</h2>
            <p>The important things, without the fine-print maze.</p>
          </div>
          <div className={styles.faqList}>
            {LANDING_FAQS.map(([question, answer]) => (
              <details key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="cta-title">
          <div className={styles.ctaCopy}>
            <h2 id="cta-title">Your next four years, <span>sorted.</span></h2>
            <p>Join with your college email. It’s free, and only verified students are in your feed.</p>
            <div className={styles.ctaActions}>
              <Link href="/sign-up" className={`${styles.button} ${styles.primaryButton}`}>Join CampusLoop <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link href="/courses" className={styles.textLink}>Or start a free course first <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className={styles.ctaArt} aria-hidden="true">
            <Image src="/campusloop/marketing/voxel/communities.webp" alt="" fill sizes="(max-width: 820px) 100vw, 34vw" className={styles.cardImage} />
          </div>
        </section>
      </main>

      <LandingHomeFooter />

      <Link href="/sign-up" className={styles.mobileJoinBar}>
        <span className={styles.mobileJoinCopy}>
          <strong>Free courses, notes and your campus</strong>
          <small>Join free with your college email</small>
        </span>
        <span className={styles.mobileJoinAction}>Join free <ArrowRight size={16} aria-hidden="true" /></span>
      </Link>
    </div>
  );
}

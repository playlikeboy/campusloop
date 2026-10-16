import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Heart, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { LandingCollegeSearch } from "./landing-college-search";
import { LandingFeedPreview } from "./landing-feed-preview";
import { LandingStreakSection } from "./landing-streak-section";
import { LandingBrand, LandingHomeFooter } from "./landing-home-footer";
import styles from "./campusloop-homepage-refresh.module.css";

const QUICK_LINKS = [
  { href: "/feeds", icon: MessageCircle, title: "Campus feed", body: "Confessions, polls, and what’s happening today" },
  { href: "/dating", icon: Heart, title: "Campus Match", body: "Meet verified students, on your terms" },
  { href: "/colleges", icon: GraduationCap, title: "College hubs", body: "Your campus space, plus every other one" },
];

const FAQS = [
  ["Who can join CampusLoop?", "CampusLoop is for college students. Sign up with your institutional email or use the supported student-ID verification flow."],
  ["Is the Academic Vault free?", "Students can browse and access available peer-shared notes and previous-year question papers without a paywall."],
  ["What if my college isn’t listed?", "Search the college directory, and if your campus isn’t there yet, request a hub for your institution."],
];

export function CampusLoopHomepageRefresh() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <LandingBrand />
        <nav className={styles.navLinks} aria-label="Main navigation">
          <Link href="#features">What’s inside</Link>
          <Link href="#streaks">Streaks</Link>
          <Link href="/colleges">Colleges</Link>
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
            <h1 id="hero-title">Your campus.<br /><span>Your people.</span></h1>
            <p className={styles.heroDescription}>
              Meet classmates, find free study notes, and keep up with campus life, all in one space that only verified students can enter.
            </p>
            <div className={styles.heroActions}>
              <Link href="/sign-up" className={`${styles.button} ${styles.primaryButton}`}>
                Join with your college email <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <LandingCollegeSearch />
            <p className={styles.trustNote}>
              <ShieldCheck size={17} aria-hidden="true" />
              Free to join. Verified students only.
            </p>
          </div>
          <LandingFeedPreview />
        </section>

        <section className={styles.features} id="features" aria-labelledby="features-title">
          <div className={styles.sectionIntro}>
            <h2 id="features-title">The useful bits of college life, finally in one place.</h2>
            <p>No complicated tour. Start with what you came for.</p>
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
                <Link href={href}>
                  <span className={styles.quickIcon}><Icon size={18} aria-hidden="true" /></span>
                  <span><strong>{title}</strong><small>{body}</small></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
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
            {FAQS.map(([question, answer]) => (
              <details key={question}><summary>{question}</summary><p>{answer}</p></details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="cta-title">
          <div className={styles.ctaCopy}>
            <h2 id="cta-title">Make college feel a little more <span>connected.</span></h2>
            <p>One account. Your college. Your people.</p>
            <div className={styles.ctaActions}>
              <Link href="/sign-up" className={`${styles.button} ${styles.primaryButton}`}>Join CampusLoop <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link href="/colleges" className={styles.textLink}>Browse colleges first <ArrowRight size={16} aria-hidden="true" /></Link>
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
          <strong>Your campus is waiting.</strong>
          <small>Free with your college email</small>
        </span>
        <span className={styles.mobileJoinAction}>Join free <ArrowRight size={16} aria-hidden="true" /></span>
      </Link>
    </div>
  );
}

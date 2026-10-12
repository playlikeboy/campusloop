
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Check, GraduationCap, Heart, MessageCircle, ShieldCheck, Users,
} from "lucide-react";
import styles from "./campusloop-homepage-refresh.module.css";

function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="CampusLoop home">
      <span className={styles.brandMark}>
        <Image src="/campusloop/marketing/voxel/logo.png" alt="" width={36} height={36} />
      </span>
      <span className={styles.brandName}>
        Campus<span>Loop</span><i aria-hidden="true">✦</i>
        <small>YOUR COLLEGE. YOUR PEOPLE.</small>
      </span>
    </Link>
  );
}

export function CampusLoopHomepageRefresh() {
  return (
    <div className={styles.page}>
      <div className={styles.canvas}>
        <header className={styles.header}>
          <Brand />
          <nav className={styles.navLinks} aria-label="Main navigation">
            <Link href="#features">What’s inside</Link>
            <Link href="/academics">Academic Vault</Link>
            <Link href="/communities">Communities</Link>
            <Link href="/dating">Campus Match</Link>
          </nav>
          <Link href="/sign-up" className={styles.button + " " + styles.navButton}>
            Join for free <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>

        <main id="main-landing-content">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span className={styles.statusDot} aria-hidden="true" />
                MADE FOR VERIFIED COLLEGE STUDENTS
              </p>
              <h1 id="hero-title">Your campus.<br /><span>Your people.</span></h1>
              <p className={styles.heroDescription}>
                Meet classmates, find free study notes, and keep up with campus life — all in one student-only space.
              </p>
              <div className={styles.heroActions}>
                <Link href="/sign-up" className={styles.button + " " + styles.primaryButton}>
                  Join with college email <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link href="/colleges" className={styles.button + " " + styles.secondaryButton}>
                  <GraduationCap size={17} aria-hidden="true" /> Find your college
                </Link>
              </div>
              <div className={styles.trustNote}>
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Free to join</span><span className={styles.trustDivider} aria-hidden="true" />
                <span>Built for students</span><span className={styles.trustDivider} aria-hidden="true" />
                <span>1,350+ college hubs</span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroArtwork}>
                <Image
                  src="/campusloop/marketing/voxel/colleges.webp"
                  alt="Voxel-style university courtyard with students meeting, studying, and exploring campus"
                  fill priority sizes="(max-width: 900px) 100vw, 52vw"
                  className={styles.heroImage}
                />
                <div className={styles.artCaption}>
                  <span className={styles.captionIcon}><MessageCircle size={16} aria-hidden="true" /></span>
                  <span><strong>Campus is talking</strong><small>Conversations from your college</small></span>
                  <span className={styles.liveDot} aria-label="Live" />
                </div>
                <div className={styles.vaultFloat}>
                  <span className={styles.vaultIcon}><BookOpen size={17} aria-hidden="true" /></span>
                  <span><strong>Academic Vault</strong><small>Notes shared by students</small></span>
                </div>
              </div>
              <p className={styles.imageNote}>A little less scrolling through group chats. A lot more college life.</p>
            </div>
          </section>

          <section className={styles.proofbar} aria-label="CampusLoop at a glance">
            <div><strong>1,350+</strong><span>college hubs</span></div>
            <span className={styles.proofDivider} aria-hidden="true" />
            <div><strong>45,000+</strong><span>notes &amp; PYQs</span></div>
            <span className={styles.proofDivider} aria-hidden="true" />
            <div><strong>₹0</strong><span>to join the loop</span></div>
            <p>Students first. Always.</p>
          </section>

          <section className={styles.features} id="features" aria-labelledby="features-title">
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>A BETTER KIND OF COLLEGE APP</p>
              <h2 id="features-title">The useful bits of college life.<br /><span>Finally in one place.</span></h2>
              <p>No complicated tour. Start with what you came for.</p>
            </div>

            <div className={styles.featureGrid}>
              <article className={styles.featureCard + " " + styles.academicCard}>
                <div className={styles.featureCopy}>
                  <span className={styles.featureIcon + " " + styles.blueIcon}><BookOpen size={20} aria-hidden="true" /></span>
                  <p className={styles.featureLabel}>STUDY SMARTER</p>
                  <h3>That one note you really need.</h3>
                  <p>Find peer-shared notes, solved PYQs, and study material for the semester — free.</p>
                  <Link href="/academics" className={styles.textLink}>Explore the Academic Vault <ArrowRight size={16} aria-hidden="true" /></Link>
                </div>
                <div className={styles.featureImage}>
                  <Image
                    src="/campusloop/marketing/voxel/academics.webp"
                    alt="Warm voxel-style dorm study desk with a laptop, books, notes, and a campus view"
                    fill sizes="(max-width: 900px) 100vw, 38vw" className={styles.cardImage}
                  />
                </div>
              </article>

              <article className={styles.featureCard + " " + styles.communityCard}>
                <div className={styles.communityImage}>
                  <Image
                    src="/campusloop/marketing/voxel/events.webp"
                    alt="Voxel-style student club fair with colorful stalls and classmates meeting outdoors"
                    fill sizes="(max-width: 900px) 100vw, 36vw" className={styles.cardImage}
                  />
                </div>
                <div className={styles.featureCopy}>
                  <span className={styles.featureIcon + " " + styles.peachIcon}><Users size={20} aria-hidden="true" /></span>
                  <p className={styles.featureLabel}>FIND YOUR CROWD</p>
                  <h3>There’s a group for your kind of people.</h3>
                  <p>Discover clubs, meet teammates, and find campus events without digging through a dozen chats.</p>
                  <Link href="/communities" className={styles.textLink}>Explore communities <ArrowRight size={16} aria-hidden="true" /></Link>
                </div>
              </article>
            </div>

            <div className={styles.quickLinks}>
              <Link href="/feeds"><span className={styles.quickIcon}><MessageCircle size={18} aria-hidden="true" /></span><span><strong>Campus feed</strong><small>Talk about what’s happening</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/dating"><span className={styles.quickIcon}><Heart size={18} aria-hidden="true" /></span><span><strong>Campus Match</strong><small>Meet verified people nearby</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
              <Link href="/colleges"><span className={styles.quickIcon}><GraduationCap size={18} aria-hidden="true" /></span><span><strong>College hubs</strong><small>Find your campus space</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </section>

          <section className={styles.howSection} id="how-it-works" aria-labelledby="how-title">
            <div className={styles.howHeading}>
              <p className={styles.eyebrow}>YOU’RE THREE STEPS AWAY</p>
              <h2 id="how-title">Your college, <span>connected.</span></h2>
              <p>Get set up in a minute. Spend the rest of the time making it yours.</p>
            </div>
            <ol className={styles.steps}>
              <li><span className={styles.stepNumber}>01</span><div><h3>Verify you’re a student</h3><p>Sign up with your institutional email or student ID.</p></div></li>
              <li><span className={styles.stepNumber}>02</span><div><h3>Find your college hub</h3><p>Start with the campus you know, then explore beyond it.</p></div></li>
              <li><span className={styles.stepNumber}>03</span><div><h3>Join the conversation</h3><p>Share notes, discover communities, and meet your people.</p></div></li>
            </ol>
          </section>

          <section className={styles.privacyStrip} aria-label="Student-first promise">
            <span className={styles.privacyIcon}><ShieldCheck size={23} aria-hidden="true" /></span>
            <div><h2>Made for students, not spectators.</h2><p>CampusLoop is built around verified student access and student-led spaces.</p></div>
            <Link href="/safety" className={styles.textLink}>How safety works <ArrowRight size={16} aria-hidden="true" /></Link>
          </section>

          <section className={styles.faqSection} id="faq" aria-labelledby="faq-title">
            <div className={styles.faqHeading}>
              <p className={styles.eyebrow}>GOOD QUESTIONS</p>
              <h2 id="faq-title">Before you join.</h2>
              <p>The important things, without the fine-print maze.</p>
            </div>
            <div className={styles.faqList}>
              <details><summary>Who can join CampusLoop?</summary><p>CampusLoop is for college students. Sign up with your institutional email or use the supported student-ID verification flow.</p></details>
              <details><summary>Is the Academic Vault free?</summary><p>Students can browse and access available peer-shared notes and previous-year question papers without a paywall.</p></details>
              <details><summary>What if my college isn’t listed?</summary><p>Visit the college directory to check existing hubs or request a hub for your institution.</p></details>
            </div>
          </section>

          <section className={styles.finalCta} aria-labelledby="cta-title">
            <div className={styles.ctaCopy}>
              <p className={styles.eyebrow}>YOUR CAMPUS IS WAITING</p>
              <h2 id="cta-title">Make college feel a little more <span>connected.</span></h2>
              <p>One account. Your college. Your people.</p>
              <Link href="/sign-up" className={styles.button + " " + styles.ctaButton}>Join CampusLoop <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className={styles.ctaMark} aria-hidden="true"><Check size={32} /></div>
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}><Brand /><p>One connected digital home for college life.</p></div>
          <div className={styles.footerColumn}><strong>Explore</strong><Link href="/feeds">Campus feed</Link><Link href="/academics">Academic Vault</Link><Link href="/communities">Communities</Link></div>
          <div className={styles.footerColumn}><strong>Your campus</strong><Link href="/colleges">College directory</Link><Link href="/dating">Campus Match</Link><Link href="/events">Campus events</Link></div>
          <div className={styles.footerColumn}><strong>About</strong><Link href="/about">About CampusLoop</Link><Link href="/safety">Student safety</Link><Link href="/docs">Help &amp; FAQs</Link></div>
          <div className={styles.footerBottom}><span>© {new Date().getFullYear()} CampusLoop</span><span>Made for campus life in India.</span></div>
        </footer>
      </div>
    </div>
  );
}

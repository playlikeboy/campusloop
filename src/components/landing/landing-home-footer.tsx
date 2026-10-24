import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import styles from "./campusloop-homepage-refresh.module.css";

const COLUMNS = [
  { title: "Explore", links: [["/feeds", "Campus feed"], ["/academics", "Academic Vault"], ["/communities", "Communities"], ["https://opportunities.campusloop.space/", "Opportunities"]] },
  { title: "Your campus", links: [["/colleges", "College directory"], ["/college-request", "Request a hub"], ["/dating", "Campus Match"]] },
  { title: "Learn", links: [["/guide", "Product guide"], ["/investors", "For investors"], ["/docs", "Engineering docs"], ["/help", "Help & FAQs"]] },
  { title: "About", links: [["/about", "About CampusLoop"], ["/safety", "Student safety"], ["/contact", "Contact"]] },
] as const;

export function LandingBrand() {
  return (
    <Link href="/" className={styles.brand} aria-label="CampusLoop home">
      <span className={styles.brandMark}>
        <Image src="/campusloop/marketing/voxel/logo.png" alt="" width={34} height={34} />
      </span>
      <span className={styles.brandName}>Campus<span>Loop</span></span>
    </Link>
  );
}

export function LandingHomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <LandingBrand />
        <p>One connected home for college life in India.</p>
        <a href="https://www.instagram.com/campusloop.space/" target="_blank" rel="noopener noreferrer" className={styles.instaLink}>
          <InstagramIcon className="size-[18px]" /> Follow @campusloop.space
        </a>
        <div className={styles.socials}>
          <a href="https://www.linkedin.com/company/mycampusloop/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="CampusLoop on LinkedIn">
            <LinkedinIcon className="size-[18px]" />
          </a>
          <a href="https://x.com/company/mycampusloop/" target="_blank" rel="noopener noreferrer" aria-label="CampusLoop on X">
            <XIcon className="size-[16px]" />
          </a>
        </div>
      </div>
      {COLUMNS.map((column) => (
        <nav key={column.title} className={styles.footerColumn} aria-label={column.title}>
          <strong>{column.title}</strong>
          {column.links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      ))}
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} CampusLoop</span>
        <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowRight, Loader2, MapPin, Plus, Search, X } from "lucide-react";
import { useColleges } from "@/hooks/use-colleges";
import styles from "./campusloop-homepage-refresh.module.css";

const MIN_QUERY = 2;

function CollegeResults({ query }: { query: string }) {
  const { colleges, isLoading, error } = useColleges(5, 1, query);

  if (error) {
    return (
      <p className={styles.searchStatus} role="status">
        Search is taking a break.{" "}
        <Link href={`/colleges?q=${encodeURIComponent(query)}`}>Browse the directory instead</Link>
      </p>
    );
  }

  if (isLoading && colleges.length === 0) {
    return (
      <p className={styles.searchStatus} role="status">
        <Loader2 size={16} className={styles.spin} aria-hidden="true" /> Looking for “{query}”…
      </p>
    );
  }

  if (colleges.length === 0) {
    return (
      <div className={styles.searchStatus} role="status">
        <span>No hub for “{query}” yet.</span>
        <Link href="/college-request" className={styles.searchRequest}>
          <Plus size={15} aria-hidden="true" /> Request your college
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="sr-only" role="status">{colleges.length} colleges found</p>
      <ul className={styles.searchResults}>
        {colleges.map((college) => (
          <li key={college.id}>
            <Link href={college.slug ? `/colleges/${college.slug}` : `/colleges?q=${encodeURIComponent(college.name)}`}>
              <span className={styles.resultName}>{college.name}</span>
              {(college.district || college.state) && (
                <span className={styles.resultPlace}>
                  <MapPin size={13} aria-hidden="true" />
                  {[college.district, college.state].filter(Boolean).join(", ")}
                </span>
              )}
              <ArrowRight size={15} aria-hidden="true" className={styles.resultArrow} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function LandingCollegeSearch() {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(value.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [value]);

  const showResults = query.length >= MIN_QUERY;

  return (
    <form
      role="search"
      className={styles.search}
      onSubmit={(event) => {
        event.preventDefault();
        router.push(value.trim() ? `/colleges?q=${encodeURIComponent(value.trim())}` : "/colleges");
      }}
    >
      <label htmlFor={inputId} className={styles.searchLabel}>
        Is your college here? Search 1,350+ hubs
      </label>
      <div className={styles.searchField}>
        <Search size={18} aria-hidden="true" className={styles.searchIcon} />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Escape") setValue(""); }}
          placeholder="Try “BIT Mesra” or “Pune”"
          autoComplete="off"
          enterKeyHint="search"
        />
        {value && (
          <button type="button" className={styles.searchClear} onClick={() => setValue("")} aria-label="Clear search">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {showResults && <CollegeResults query={query} />}
    </form>
  );
}

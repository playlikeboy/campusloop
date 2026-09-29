"use client";

import { ArrowUpRight, BookOpen, Download, GraduationCap, Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const SAMPLE_RESOURCES = [
  {
    id: "1",
    title: "Operating Systems: End-Sem 5-Year PYQs Solved",
    branch: "Computer Science",
    category: "PYQ",
    downloads: "2.4k",
    rating: "4.9",
    tag: "High Yield",
    pages: "38 pages",
    college: "IIT Bombay",
  },
  {
    id: "2",
    title: "Data Structures & Algorithms: Complete Handwritten Notes",
    branch: "Information Tech",
    category: "Notes",
    downloads: "3.8k",
    rating: "4.8",
    tag: "Staff Pick",
    pages: "72 pages",
    college: "BITS Pilani",
  },
  {
    id: "3",
    title: "Computer Networks: Socket Programming Lab Manual",
    branch: "CS & Core",
    category: "Lab Manual",
    downloads: "1.2k",
    rating: "4.7",
    tag: "Verified",
    pages: "24 pages",
    college: "NIT Trichy",
  },
  {
    id: "4",
    title: "Engineering Mathematics III: 1-Night Exam Cheatsheet",
    branch: "All Branches",
    category: "Cheatsheet",
    downloads: "4.9k",
    rating: "5.0",
    tag: "Exam Lifesaver",
    pages: "8 pages",
    college: "BIT Mesra",
  },
];

const CATEGORIES = ["All", "PYQ", "Notes", "Lab Manual", "Cheatsheet"];

export function AcademicsQuickVault() {
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return SAMPLE_RESOURCES.filter((r) => {
      const matchCat = selectedCat === "All" || r.category === selectedCat;
      const matchSearch =
        !search.trim() ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.branch.toLowerCase().includes(search.toLowerCase()) ||
        r.college.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, search]);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 select-none relative bg-pastel-mesh">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <GraduationCap className="size-3.5" />
            <span>The Academic Vault</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Passed down from seniors who survived.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto font-medium">
            Verified lecture notes, handwritten cheatsheets, and solved PYQ papers curated by your fellow
            classmates.
          </p>
        </div>

        {/* Interactive Search & Filter Controls */}
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PYQs, subjects, or courses (e.g., DSA, OS, Math)..."
              className="w-full h-12 pl-11 pr-4 rounded-full bg-card/90 border border-border/70 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  sounds.tap();
                  haptics.light();
                  setSelectedCat(cat);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  selectedCat === cat
                    ? "bg-foreground text-background shadow-xs font-black"
                    : "bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href="/academics"
              onClick={() => {
                sounds.tap();
                haptics.light();
              }}
              className="neo-card p-4 sm:p-5 rounded-[26px] flex flex-col justify-between space-y-3 hover:-translate-y-0.5 transition-all group cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-[11px] text-muted-foreground font-medium">
                  {item.college} &bull; {item.branch} &bull; {item.pages}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="size-3.5 text-primary" />
                  <span className="font-bold text-foreground">{item.downloads}</span>
                  <span className="text-[10px]">downloads</span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                  <span>Open Vault</span>
                  <ArrowUpRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Vault Action */}
        <div className="text-center pt-2">
          <Link
            href="/academics"
            onClick={() => {
              sounds.tap();
              haptics.medium();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card hover:bg-muted text-xs font-black text-foreground border border-border/80 shadow-2xs hover:border-border transition-all cursor-pointer"
          >
            <BookOpen className="size-4 text-amber-500" />
            <span>Explore 45,000+ Notes in the Full Vault</span>
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

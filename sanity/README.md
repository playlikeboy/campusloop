# 🧭 CampusLoop Atlas — Sanity Project & Agent Architecture

> Submission for the **DEV Community Sanity Challenge (Path One: Ship an Agent That Queries Real Content)**.
> Article: [CampusLoop Atlas: I Built an Agent That Knows What Is Actually Happening on Campus](https://dev.to/sh20raj/campusloop-atlas-i-built-an-agent-that-knows-what-is-actually-happening-on-campus-1iai)

---

## 🎯 What Is CampusLoop Atlas?

CampusLoop Atlas is an intelligent campus navigator agent that answers complex questions about clubs, events, eligibility, venues, and schedules by reasoning over a **structured Sanity Content Lake** via GROQ and Sanity Context, rather than naive keyword search.

### Benchmark Capabilities (Levels 1–6)
1. **Level 1 — Simple Directory Retrieval**: "What clubs exist?"
2. **Level 2 — Single-Filter**: "Which events are happening after 6 PM?"
3. **Level 3 — Multi-Constraint**: "Which AI events after 6 PM are beginner-friendly?"
4. **Level 4 — Relationship Reasoning**: "Which beginner-friendly events are hosted by clubs that teach web development?"
5. **Level 5 — Real-World 5-Constraint Ambiguity**: "I am a first-year student, want to learn frontend development, cannot attend before 6 PM, and don't want competitive programming. What can I attend?"
6. **Level 6 — Provenance & Conflict Handling**: "Why does one source say 5 PM and another say 6 PM?"
7. **Inspectable "Why?" Button**: Shows matched constraints, excluded items with reasons, and exact Sanity source citations.

---

## 📁 Directory Structure

```text
campusloop/
├── sanity/
│   ├── sanity.config.ts          # Sanity Studio configuration
│   ├── schemas/                  # Content types
│   │   ├── club.ts               # Clubs & student communities
│   │   ├── event.ts              # Events with timing, venue & organizer refs
│   │   ├── person.ts             # Organizers, mentors & leads
│   │   ├── venue.ts              # Campus venues, buildings & areas
│   │   ├── category.ts           # Taxonomy & tags
│   │   ├── announcement.ts       # Bulletins & conflict test records
│   │   └── index.ts              # Export barrel
│   └── seed/
│       ├── campus-data.ts        # Typed TypeScript dataset
│       ├── campus-seed.ndjson    # Official Sanity NDJSON import file
│       └── seed.ts               # Live push script using @sanity/client
├── src/
│   ├── lib/
│   │   ├── sanity/
│   │   │   ├── client.ts         # Resilient Sanity client + offline seed fallback
│   │   │   └── queries.ts        # GROQ queries for relationship traversal
│   │   └── atlas/
│   │       └── agent.ts          # Atlas Agent reasoning & evidence engine
│   ├── app/
│   │   ├── api/atlas/route.ts    # REST endpoint for Atlas agent queries
│   │   └── app/(main)/atlas/     # Interactive Atlas UI page (/app/atlas)
│   └── components/atlas/
│       └── atlas-client.tsx      # Benchmark Matrix & "Why?" evidence drawer
```

---

## ⚡ Quickstart: Connecting to Your Sanity Project

### Step 1: Create or Select Your Sanity Project
If you already have a Sanity project:
Copy your **Project ID** from [manage.sanity.io](https://manage.sanity.io).

If you need a new Sanity project:
```bash
# Run inside your terminal (takes 30 seconds)
npx sanity@latest init --bare
```
Note down your **Project ID** (e.g. `pcz2oqqd` or similar 8-character string).

---

### Step 2: Set Environment Variables
Add to your `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
# Optional: needed only if your dataset is private or for live script seeding:
SANITY_API_WRITE_TOKEN=your_sanity_editor_or_admin_token
```

---

### Step 3: Seed the Campus Dataset
You can seed in either of two ways:

#### Option A: Sanity CLI (Recommended)
```bash
npx sanity@latest dataset import ./sanity/seed/campus-seed.ndjson production --replace
```

#### Option B: Bun / Node Script
```bash
bun run sanity/seed/seed.ts
```

*Note: Even without a live Sanity Project ID, CampusLoop Atlas operates immediately in offline simulation mode using the identical structured campus graph!*

---

### Step 4: Verify the Interactive Agent
1. Start the dev server: `bun run dev`
2. Open **`http://localhost:3000/app/atlas`**
3. Click through the **Level 1 to Level 6** preset test pills.
4. Click **"Why this answer?"** to inspect the constraint matching, exclusion breakdown, and source documents.
5. Click **"GROQ"** to inspect the underlying Sanity query!

---

## 🌐 Public URLs for Your DEV Article

These are now live and active:
- **Sanity Project ID**: `sekwib79`
- **Sanity Manage**: `https://www.sanity.io/manage/project/sekwib79`
- **Live Demo**: `https://campusloop.space/app/atlas`
- **Public Dataset Query**: `https://sekwib79.api.sanity.io/v2024-03-01/data/query/production?query=*[_type==%22event%22]`
- **Sanity Context MCP**: `https://sekwib79.api.sanity.io/v2024-03-01/context/mcp`
- **Agent Session**: `https://github.com/SH20RAJ/campusloop/blob/main/sanity/AGENT_SESSION.md`

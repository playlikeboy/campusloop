# 🎓 CampusLoop 500+ Community Ignition & Seeding System

This package provides an authorized, high-quality content seeding pipeline for **CampusLoop** (`https://campusloop.space`), engineered to populate every active product surface with vibrant, diverse, and authentic student conversations.

---

## 🎯 Batch Identifier & Invariants

- **Batch Identifier**: `campusloop-seed-2026-09`
- **ID Determinism**: Every record across all database tables is prefixed with `seed_202609_`.
- **Anonymity Guarantee (Rule 8)**: Anonymous confessions and posts carry `author_id: null` in the database. Real identities are sealed into `anon_identity_vault` using AES-256-GCM.
- **Feed Visibility**: Posts are published with `is_seeded = false` and `status = 'PUBLISHED'` so they seamlessly render on the live student feed (`/app`), while seed personas are marked `is_seeded = true` for administrative tracking.
- **Idempotency**: Running `seed-pipeline.ts` multiple times updates existing records via `onConflictDoUpdate` / `onConflictDoNothing`, completely preventing duplicate rows.

---

## 📦 File Inventory

| File | Description |
|---|---|
| [`config.ts`](./config.ts) | Core constants, institution ID resolvers, and historical timestamp distribution algorithms. |
| [`personas.ts`](./personas.ts) | 55 richly characterized student profiles across premier Indian institutes (IITD, IITB, BIT Mesra, BITS, DTU, Jadavpur, Anna Univ, etc.). |
| [`communities-data.ts`](./communities-data.ts) | 36 distinct student communities across 7 domains with descriptions, rules, and banners. |
| [`posts-feed.ts`](./posts-feed.ts) | 60 high-signal feed posts (Senior advice, study techniques, questions, polls, and campus culture). |
| [`posts-feed-2.ts`](./posts-feed-2.ts) | 40 additional feed posts (Coding discussions, campus life observations, tech debates). |
| [`posts-feed-3.ts`](./posts-feed-3.ts) | 24 additional feed posts (Hardware hacks, academic advice, and reflections). |
| [`posts-confessions.ts`](./posts-confessions.ts) | 95 relatable, wholesome, and hilarious student confessions (100% harassment-free and safe). |
| [`posts-communities.ts`](./posts-communities.ts) | 60 community-specific discussion posts across core tech and academic hubs. |
| [`posts-communities-2.ts`](./posts-communities-2.ts) | 16 community-specific discussion posts for specialized clubs (Cloud, Robotics, CyberSec, Finance). |
| [`posts-data.ts`](./posts-data.ts) | Master aggregation barrel exporting 295+ total structured post items. |
| [`comments-data.ts`](./comments-data.ts) | 200+ threaded parent comments and nested replies fostering genuine multi-perspective conversations. |
| [`academic-resources-data.ts`](./academic-resources-data.ts) | 35 verified academic resources (high-yield notes, formula sheets, PYQs) with student ratings and reviews. |
| [`events-data.ts`](./events-data.ts) | 25 campus events (hackathons, workshops, cultural open mics, sports tournaments) with student registrations. |
| [`stories-data.ts`](./stories-data.ts) | 30 active 24-hr campus vibe stories with vivid gradients and future expiration dates. |
| [`seed-pipeline.ts`](./seed-pipeline.ts) | Orchestration runner executing the full 10-stage ingestion pipeline with progress logs. |
| [`validate.ts`](./validate.ts) | Automated audit and verification test suite verifying foreign keys, feeds, and counts. |
| [`rollback.ts`](./rollback.ts) | Surgical rollback script purging only batch `seed_202609_%` in reverse foreign key order. |

---

## 🚀 Execution Guide

### 1. Ingest Dataset
To publish all 600+ seed items into Neon PostgreSQL:
```bash
bun run scripts/campusloop-seeding/seed-pipeline.ts
```

### 2. Validate Everything
To run the automated validation and integrity test suite:
```bash
bun run scripts/campusloop-seeding/validate.ts
```

### 3. Surgical Rollback (If Needed)
To cleanly remove this batch without affecting genuine students or other datasets:
```bash
bun run scripts/campusloop-seeding/rollback.ts
```

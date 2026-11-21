# CampusLoop

<p align="center">
  <img src="public/logo.png" alt="CampusLoop logo" width="88" height="88" />
</p>

<p align="center">
  <strong>Your campus. Only your campus.</strong><br />
  The social app for Indian college students. Sign up with your college email.
</p>

<p align="center">
  <a href="https://campusloop.space"><strong>Website</strong></a> ·
  <a href="https://campusloop.space/download"><strong>Android beta</strong></a> ·
  <a href="https://campusloop.space/#video"><strong>Launch film</strong></a> ·
  <a href="https://www.instagram.com/campusloop.space/"><strong>Instagram</strong></a> ·
  <a href="https://www.producthunt.com/products/campusloop"><strong>Product Hunt</strong></a>
</p>

---

## What it is

College life is spread across WhatsApp groups, confession pages, Discord servers and event links. CampusLoop puts it in one app, and only verified students get in. 1,442 Indian colleges are listed, each with its own campus space.

The app has five tabs:

| Tab | What you get |
|---|---|
| **Home** (`/feeds`) | Your campus feed, anonymous confessions, polls, stories and the campus board |
| **Events** (`/events`) | Fests, hackathons and workshops with dates, deadlines and one-tap register |
| **Learn** (`/courses`, `/academics`) | Free courses, notes and previous-year papers (PYQs) for your branch |
| **Chat** (`/chat`) | Direct messages and group chats with your batch |
| **You** (`/profile`) | Profile, streaks, Loop Points, saved posts and settings |

Also inside: Secret Crush (`/crush`), communities, invites, and push notifications for replies, events and streaks.

## Android betas

Three Android builds run side by side while we pick one. All are signed with the same release key.

| App | Package | Source | Download |
|---|---|---|---|
| Native (Expo) | `space.campusloop.app` | [`apps/mobile`](apps/mobile) | [campusloop-beta.apk](https://github.com/playlikeboy/campusloop/releases/download/beta/campusloop-beta.apk) |
| Web app (Capacitor) | `space.campusloop.web` | [`apps/capacitor`](apps/capacitor) | [campusloop-web-beta.apk](https://github.com/playlikeboy/campusloop/releases/download/beta-web/campusloop-web-beta.apk) |
| Chrome app (TWA) | `space.campusloop.twa` | [`apps/twa`](apps/twa) | [campusloop-twa-beta.apk](https://github.com/playlikeboy/campusloop/releases/download/beta-twa/campusloop-twa-beta.apk) |

GitHub Actions builds each APK when its folder changes and uploads it to the matching release (`beta`, `beta-web`, `beta-twa`).

## Tech stack

- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS v4, SWR
- **Data:** PostgreSQL on Neon, Drizzle ORM, Upstash Redis
- **Auth:** Hexclave (college email + Google), plus an OAuth/OIDC server for the mobile app
- **Hosting:** Cloudflare Workers via OpenNext, R2 cache, D1 tag cache
- **Push:** Web Push (RFC 8291, VAPID) and Expo push
- **Feed ranking:** value model with per-post engagement stats, test pools for new posts and a personal interest vector ([docs/RECOMMENDATION_ALGORITHMS_DEEP_DIVE.md](docs/RECOMMENDATION_ALGORITHMS_DEEP_DIVE.md))
- **Tooling:** Bun, TypeScript, Vitest, ESLint, Biome

## Project layout

```
src/app/            routes (App Router); (app)/(main) holds the logged-in tabs
src/components/     UI, shells, feature components
src/lib/            feed ranking, push, growth, auth helpers, analytics
src/db/schema/      Drizzle schema
drizzle/manual/     hand-applied SQL for production
apps/mobile/        Expo Android app
apps/capacitor/     Capacitor Android app
apps/twa/           Trusted Web Activity Android app
scripts/            seeding, data import, launch film, design checks
docs/               architecture, analytics, API and feature notes
.github/workflows/  deploy, APK builds, engagement cron, daily data jobs
```

## Run it locally

```bash
git clone https://github.com/playlikeboy/campusloop.git
cd campusloop
bun install
cp .env.example .env    # then fill in the values
bun run dev
```

The minimum to boot is `DB_URL`, `NEXT_PUBLIC_HEXCLAVE_API_URL`, `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` and `HEXCLAVE_SECRET_SERVER_KEY`. Everything else (push, email, Redis, image upload) is optional and turns off cleanly when missing. See [`.env.example`](.env.example) for the full list.

### Database

Apply schema changes with `bun run db:push`. Don't use `drizzle-kit generate`: the old migration chain in `drizzle/` is stale. SQL for production goes in [`drizzle/manual/`](drizzle/manual/).

### Checks

Run these before pushing. CI deploys every push to `main`.

```bash
bun run typecheck      # 0 errors
bun run lint           # 0 errors
bun run test           # vitest
bun run check:design   # design-system rules
bun run build
```

The build needs about 5 GB of memory. Stop other `next dev` servers first.

## Deploy

Pushing to `main` runs [`deploy.yml`](.github/workflows/deploy.yml), which builds with OpenNext and deploys to Cloudflare Workers. To deploy by hand: `bun run deploy`.

Scheduled jobs:

- [`engagement-cron.yml`](.github/workflows/engagement-cron.yml): every 30 min, streak and event reminders (max 3 pushes a day, quiet 23:00–08:00 IST)
- `daily-academic-materials.yml` and `daily-opportunities.yml`: daily content imports

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Feed ranking](docs/RECOMMENDATION_ALGORITHMS_DEEP_DIVE.md)
- [Mobile API and auth](docs/mobile-api.md)
- [Analytics events](docs/analytics.md)
- [Design system](DESIGN.md)
- [Changelog](docs/CHANGELOG.md)

## Policies

[Safety](https://campusloop.space/safety) · [Privacy](https://campusloop.space/privacy) · [Terms](https://campusloop.space/terms) · [Contact](https://campusloop.space/contact)

## License

Proprietary. The source is public to read, but all rights are reserved. See [LICENSE](LICENSE).

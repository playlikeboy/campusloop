# SEO matrix — robots.txt, meta robots, sitemaps

Phase 4 contract: for every route pattern the three signals agree. A route is
either fully public (crawlable, `index,follow`, listed in a sitemap) or fully
private (Disallowed, `noindex,nofollow`, absent from every sitemap). The only
exception is anonymous content, which cannot be pattern-blocked and relies on
meta robots plus sitemap exclusion.

Sources: `src/app/robots.ts`, `src/app/sitemap.xml/route.ts`,
`src/app/sitemaps/*/route.ts`, the `(app)` layout default
(`robots: { index: false, follow: false }`) and each page's own metadata.

Legend: **Allow** = not Disallowed in robots.txt (there are no Allow rules).

## Public, indexable

| Route pattern | robots.txt | meta robots | Sitemap |
| --- | --- | --- | --- |
| `/` | Allow | index,follow | static.xml |
| `/about`, `/safety`, `/help`, `/contact`, `/privacy`, `/terms`, `/sitemap`, `/pitch`, `/investors` | Allow | index,follow (page metadata) | static.xml |
| `/overview` | Allow | — (308 → `/pitch`, middleware) | no |
| `/docs`, `/docs/[slug]` | Allow | index,follow | static.xml |
| `/guide`, `/guide/[slug]` | Allow | index,follow (inherits root) | static.xml |
| `/developers`, `/developers/SKILL.md` | Allow | index,follow (inherits root) | static.xml |
| `/colleges`, `/colleges?page=N`, `/colleges?state=X` | Allow | index,follow; self-canonical per page/state | static.xml (`/colleges`) |
| `/college/[id]` | Allow | index,follow | colleges.xml (viewer-hub excluded) |
| `/post/[id]` (non-anonymous, non-confession, published, not seeded) | Allow | index,follow | posts.xml |
| `/post/[id]/comment/[commentId]` | Allow | index,follow (inherits post rules) | no (comments.xml removed; comments rank through their post) |
| `/communities`, `/communities/[id]` (privacy = PUBLIC) | Allow | index,follow | communities.xml (PUBLIC only) |
| `/hashtag/[tag]`, `/branch/[slug]`, `/posts/[type]`, `/explore` | Allow | index,follow | no (query-like hubs) |
| `/academics`, `/academics/study-material`, `/academics/study-material/sources` | Allow | index,follow | academics.xml + static.xml |
| `/academics/study-material/[slug]` | Allow | index,follow | academics.xml |
| `/courses`, `/courses/category/[c]`, `/courses/[slug]` (listed) | Allow | index,follow | academics.xml |
| `/articles`, `/articles/[slug]` (published) | Allow | index,follow | articles.xml |
| `/events`, `/events/[id]`, `/events/category/[c]`, `/events/closed` | Allow | index,follow | events.xml (`/e/[id]` form) + static.xml |
| `/e/[id]`, `/a/[slug]` | Allow | index,follow | events.xml / no (articles.xml lists canonical `/articles/`) |
| `/marketplace`, `/marketplace/{food,rentals,barber,water,laundry,supermarket}`, `/buy-and-sell`, `/housing`, `/gaming`, `/lost-and-found`, `/developer` | Allow | index,follow | no (thin listing pages; add when they have stable public content) |

## Private or noindex

| Route pattern | robots.txt | meta robots | Sitemap |
| --- | --- | --- | --- |
| `/app/*` (legacy) | Disallow | — (308 to clean route) | no |
| `/feeds` | Disallow | noindex (app default) | no |
| `/chat`, `/chat/[id]` | Disallow | noindex,nofollow | no |
| `/notifications`, `/settings/*`, `/saved`, `/onboarding` | Disallow | noindex (app default / explicit) | no |
| `/profile`, `/profile/[username]`, `/@[username]` | Disallow (`/profile`, `/@`) | noindex,follow | no (profiles.xml removed) |
| `/confessions` | Disallow | noindex,nofollow | no |
| `/post/[id]` where `isAnonymous` or type `ANONYMOUS`/`CONFESSION` | Allow (cannot pattern-block) | noindex,nofollow | excluded from posts.xml |
| `/post/[id]` seeded (`isSeeded` or `seed_202609_*`) or unpublished | Allow | noindex,nofollow | excluded from posts.xml |
| `/post/[id]` imported (`external_posts` row) | Allow | index (mirrors canonical source link) | excluded from posts.xml |
| `/communities/[id]` PRIVATE/UNLISTED | Allow | noindex,nofollow | excluded |
| `/academics/study-material/saved`, `/academics/study-material/upload`, `/academics/study-material/search`, `/academics/study-material/[slug]/watch` | Disallow (saved, upload) / Allow (search, watch) | noindex | no |
| `/courses/my`, `/courses/new`, `/courses/[slug]/edit`, `/courses/[slug]` unlisted | Allow | noindex | excluded |
| `/dating/*`, `/matching/*`, `/crush`, `/random` | Disallow | noindex (app/dating default) | no |
| `/marketplace/cart`, `/marketplace/checkout`, `/marketplace/order/*`, `/marketplace/orders`, `/marketplace/*/orders` | Disallow | noindex,nofollow | no |
| `/buy-and-sell/new`, `/hub/new`, `/housing/new`, `/rideshare/new`, `/gaming/new`, `/post/new`, `/post/[id]/edit`, `/events/new`, `/events/manage/*`, `/events/dashboard`, `/events/my-tickets`, `/articles/new`, `/articles/[slug]/edit`, `/articles/dashboard`, `/developer/apps/*` | Allow | noindex (app default / explicit) | no |
| `/reels`, `/reels/[slug]` | Allow | — (redirect to `/feeds`) | no (reels.xml removed) |
| `/story/[id]`, `/stories/new` | Allow | noindex,follow | no |
| `/admin/*`, `/admin-login`, `/api/*`, `/handler/*`, `/oauth/*`, `/merchant-portal/*`, `/invalid-email`, `/logout` | Disallow | noindex (admin/merchant layouts) | no |

## Sitemap index

`/sitemap.xml` → `static`, `colleges`, `posts`, `communities`, `articles`, `events`, `academics`.
Removed: `profiles.xml` (profiles are noindex), `comments.xml` (comments inherit their post), `reels.xml` (`/reels` redirects to `/feeds`).

Every dynamic sitemap emits `<lastmod>` from `updatedAt` with `createdAt` fallback and is capped at 50,000 URLs. `static.xml` has no `<lastmod>` because static pages carry no honest modification timestamp.

## Disagreements fixed in Phase 4

- Sitemaps, canonicals, OG `url`, JSON-LD and emails pointed at `campusloop.space/app/...` (Disallowed). All rewritten to clean routes.
- `/saved`, `/academics/study-material/saved`, `/academics/study-material/upload`, `/buy-and-sell/new`, `/courses/new` declared `index: true` while being private. Now `noindex`.
- `/confessions` was `index: true` and in the nav JSON-LD. Now `noindex` + Disallow and removed from `SiteNavigationElement`.
- Anonymous/confession `/post/[id]` pages were indexable. Now `noindex,nofollow` and excluded from `posts.xml`, along with seeded and imported posts.
- `/courses/[slug]` listed courses inherited the `(app)` noindex (`robots: undefined`). Now opt in explicitly.
- `/articles`, `/events`, `/lost-and-found`, `/housing`, `/gaming`, `/developer` listing pages inherited noindex. Now opt in.
- `communities.xml` listed PRIVATE/UNLISTED communities whose pages are noindex. Now PUBLIC only.
- `robots.txt` carried redundant `Allow` rules and allowed `/feeds` while the page is noindex. Removed Allow rules; `/feeds` Disallowed.
- `/reels` was in `static.xml` and `reels.xml` while redirecting to `/feeds`. Removed.

-- 0018: Article search indexing controls.
-- Additive only. Safe to run more than once.
--
--   articles.seo_status        'index' (default) or 'noindex'. noindex pages stay readable
--                              in the app, send robots noindex,follow and leave the sitemap.
--   articles.redirect_to_slug  merged near-duplicates: /articles/<slug> answers 308 to this slug.
--
-- Values are written by `bun run scripts/articles/audit-articles.ts --apply` (after review).

ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_status text NOT NULL DEFAULT 'index';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS redirect_to_slug text;

-- apply-manual.ts splits on ';', so no DO block: drop-then-add keeps this re-runnable.
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_seo_status_check;
ALTER TABLE articles ADD CONSTRAINT articles_seo_status_check CHECK (seo_status IN ('index', 'noindex'));

CREATE INDEX IF NOT EXISTS articles_seo_status_idx ON articles (seo_status);

-- Permanent global financial news archive for the Markets page.
--
-- Every article ever ingested stays here forever (Refresh only INSERTs
-- new rows, never deletes). Page 1 of the news feed is always the
-- newest 20 rows by published_at DESC — no manual "page shifting" logic
-- needed, that falls out naturally from ORDER BY + LIMIT/OFFSET.
--
-- unique_hash is a sha256 of (source + normalized title), computed in
-- the ingestion service — it's what makes the Refresh button idempotent:
-- re-fetching the same feed twice inserts nothing the second time.
-- Safe to run multiple times (IF NOT EXISTS throughout).

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source VARCHAR(120) NOT NULL,
  source_url VARCHAR(1000) NOT NULL,
  image_url VARCHAR(1000),
  country VARCHAR(80),
  region VARCHAR(80),
  category VARCHAR(60) NOT NULL DEFAULT 'Markets',
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unique_hash VARCHAR(64) NOT NULL UNIQUE
);

-- Every one of these matches a column the pagination/filter API queries
-- by (see NewsArticleRepository) — without them, ORDER BY published_at
-- DESC on a large table degrades badly once the archive grows past a
-- few thousand rows (see spec §26).
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_country ON news_articles(country);
CREATE INDEX IF NOT EXISTS idx_news_region ON news_articles(region);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source);
-- unique_hash already has an implicit unique index from the UNIQUE
-- constraint above, but named explicitly here for clarity/consistency
-- with the others and to make the dedup path's query plan obvious.
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_unique_hash ON news_articles(unique_hash);

-- Composite index for the common "country + category, newest first"
-- filter combination (spec §7 example: "India + Stocks").
CREATE INDEX IF NOT EXISTS idx_news_country_category_published
  ON news_articles(country, category, published_at DESC);

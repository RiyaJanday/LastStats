-- Idempotent startup bootstrap for the news archive.
-- Keep columns and indexes in sync with the root migration_add_news_articles.sql.
-- Hibernate assigns UUIDs through GenerationType.UUID, so this table does not
-- depend on a database-side UUID extension being available to the app user.

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_country ON news_articles(country);
CREATE INDEX IF NOT EXISTS idx_news_region ON news_articles(region);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_unique_hash ON news_articles(unique_hash);
CREATE INDEX IF NOT EXISTS idx_news_country_category_published
  ON news_articles(country, category, published_at DESC);

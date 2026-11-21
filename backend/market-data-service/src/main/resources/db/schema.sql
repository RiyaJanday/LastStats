CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(30) DEFAULT 'USER',
  is_active BOOLEAN DEFAULT TRUE,
  risk_profile VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL,
  fund_isin VARCHAR(50) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  fund_category VARCHAR(80),
  units NUMERIC(20, 6) DEFAULT 0,
  avg_nav NUMERIC(20, 4) DEFAULT 0,
  current_nav NUMERIC(20, 4) DEFAULT 0,
  invested_amount NUMERIC(20, 2) DEFAULT 0,
  current_value NUMERIC(20, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL,
  fund_isin VARCHAR(50) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  fund_category VARCHAR(80),
  transaction_type VARCHAR(30) NOT NULL,
  units NUMERIC(20, 6) NOT NULL,
  nav NUMERIC(20, 4) NOT NULL,
  amount NUMERIC(20, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  folio_number VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sip_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  portfolio_id UUID,
  fund_isin VARCHAR(50) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  monthly_amount NUMERIC(20, 2) NOT NULL,
  sip_date INT DEFAULT 1,
  start_date DATE NOT NULL,
  frequency VARCHAR(30) DEFAULT 'MONTHLY',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- Consolidated schema-drift fix for volumes created before fund_category
-- (transactions) and sip_plans existed in init.sql. Safe to run multiple times.

-- 1. transactions table was missing fund_category
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fund_category VARCHAR(80);

-- 2. sip_plans table may not exist at all on older volumes
CREATE TABLE IF NOT EXISTS sip_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  portfolio_id UUID,
  fund_isin VARCHAR(50) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  monthly_amount NUMERIC(20, 2) NOT NULL,
  sip_date INT DEFAULT 1,
  start_date DATE NOT NULL,
  frequency VARCHAR(30) DEFAULT 'MONTHLY',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. if sip_plans existed but predates user_id, backfill + enforce NOT NULL
ALTER TABLE sip_plans ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE sip_plans SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
ALTER TABLE sip_plans ALTER COLUMN user_id SET NOT NULL;

-- 4. helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_sip_plans_user_id ON sip_plans(user_id);


-- Daily portfolio snapshots, so the Dashboard can show a real
-- performance-over-time chart instead of a fabricated one.
--
-- Each row is one portfolio's totals as of one calendar date. A snapshot
-- captures whatever invested_amount/current_value the holdings table
-- held at the moment the job ran — i.e. it's only as fresh as the NAVs
-- last supplied via transactions, same source of truth the rest of the
-- app already uses. No historical data is backfilled or guessed: this
-- table starts empty and fills in one row per portfolio per day, going
-- forward from whenever this migration runs.

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  invested_amount NUMERIC(20, 2) NOT NULL,
  current_value NUMERIC(20, 2) NOT NULL,
  gain NUMERIC(20, 2) NOT NULL,
  gain_percent NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- one row per portfolio per day — lets the job safely re-run the
  -- same day (e.g. after a manual trigger) without duplicating rows
  UNIQUE (portfolio_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_date
  ON portfolio_snapshots(portfolio_id, snapshot_date);


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

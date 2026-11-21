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

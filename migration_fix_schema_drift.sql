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

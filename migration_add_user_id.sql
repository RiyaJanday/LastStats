-- Run this ONLY if your postgres volume already existed before user_id was added to sip_plans.
-- Safe to run multiple times.
ALTER TABLE sip_plans ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE sip_plans SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
ALTER TABLE sip_plans ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_sip_plans_user_id ON sip_plans(user_id);

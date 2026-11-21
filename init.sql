<<<<<<< HEAD
-- Run this once to create all tables
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(50)  DEFAULT 'USER',
    is_active     BOOLEAN      DEFAULT TRUE,
    risk_profile  VARCHAR(50),
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL DEFAULT 'My Portfolio',
    description TEXT,
    currency    VARCHAR(10) DEFAULT 'INR',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holdings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id      UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    fund_isin         VARCHAR(50) NOT NULL,
    fund_name         VARCHAR(500) NOT NULL,
    fund_category     VARCHAR(100),
    units             DECIMAL(20,6) DEFAULT 0,
    avg_nav           DECIMAL(15,4) DEFAULT 0,
    invested_amount   DECIMAL(20,2) DEFAULT 0,
    current_nav       DECIMAL(15,4),
    current_value     DECIMAL(20,2),
    last_nav_updated  TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, fund_isin)
);

CREATE TABLE IF NOT EXISTS transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id     UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    fund_isin        VARCHAR(50) NOT NULL,
    fund_name        VARCHAR(500) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    units            DECIMAL(20,6) NOT NULL,
    nav              DECIMAL(15,4) NOT NULL,
    amount           DECIMAL(20,2) NOT NULL,
    transaction_date DATE NOT NULL,
    folio_number     VARCHAR(100),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sip_plans (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id   UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    fund_isin      VARCHAR(50) NOT NULL,
    fund_name      VARCHAR(500) NOT NULL,
    monthly_amount DECIMAL(20,2) NOT NULL,
    frequency      VARCHAR(20) DEFAULT 'MONTHLY',
    sip_date       INT DEFAULT 1,
    start_date     DATE NOT NULL,
    end_date       DATE,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nav_history (
    fund_isin  VARCHAR(50) NOT NULL,
    nav_date   DATE NOT NULL,
    nav_value  DECIMAL(15,4) NOT NULL,
    PRIMARY KEY (fund_isin, nav_date)
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user      ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio   ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_nav_isin_date        ON nav_history(fund_isin, nav_date DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS portfolios_updated_at ON portfolios;
CREATE TRIGGER portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS holdings_updated_at ON holdings;
CREATE TRIGGER holdings_updated_at BEFORE UPDATE ON holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
=======
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
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99

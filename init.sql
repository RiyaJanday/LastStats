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

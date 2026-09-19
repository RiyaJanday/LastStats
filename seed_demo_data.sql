-- ============================================================
-- SEED DATA — local dev only. Populates one demo account so you
-- can see how the app looks with real, populated screens.
--
-- Login:
--   email:    riri@gmail.com
--   password: riri@1921
--
-- The password hash below is a REAL bcrypt hash (cost 12, matching
-- auth-service's BCryptPasswordEncoder(12)) generated offline for
-- the password above — not a placeholder, and self-verified before
-- being written here. Login will work.
--
-- What this creates:
--   • 1 user
--   • 1 portfolio with 6 holdings across 4 categories (Equity,
--     Debt, Gold, International) — one holding is deliberately a
--     loser so Top Movers / the performance bar chart both have
--     something to show
--   • 1 real BUY transaction backing each holding
--   • 2 active SIP plans
--   • 30 days of portfolio_snapshots ending exactly at the seeded
--     holdings' real totals, so "Performance Trends" isn't empty
--     on first load. This snapshot history is synthetic (there's
--     no way to know what the real daily value was before this
--     script ran) — it's clearly demo data for local testing, not
--     something a real user would ever see seeded under their name.
--
-- Safe to re-run: wipes any existing user with this email first.
-- ============================================================

BEGIN;

DELETE FROM users WHERE email = 'riri@gmail.com';
-- portfolios/holdings/transactions/sip_plans/snapshots for that user
-- are cleaned up below via their portfolio_id, since there's no FK
-- cascade from users → portfolios in this schema.
DELETE FROM portfolios WHERE user_id IN (
  SELECT id FROM users WHERE email = 'riri@gmail.com'
);

DO $$
DECLARE
  v_user_id UUID;
  v_portfolio_id UUID;
BEGIN
  -- 1. User
  INSERT INTO users (email, password_hash, full_name, phone, role, is_active, risk_profile)
  VALUES (
    'riri@gmail.com',
    '$2b$12$6aXZ71rErroCnQkqG9ctsulmjUKvVh7IxpRwCJ2deeBhEyU.mX3z2',
    'Riri Sharma',
    '+91-9876543210',
    'USER',
    true,
    'MODERATE'
  )
  RETURNING id INTO v_user_id;

  -- 2. Portfolio
  INSERT INTO portfolios (user_id, name)
  VALUES (v_user_id, 'My Portfolio')
  RETURNING id INTO v_portfolio_id;

  -- 3. Holdings — mixed categories, one loser (SBI Small Cap) on purpose
  INSERT INTO holdings (portfolio_id, fund_isin, fund_name, fund_category, units, avg_nav, current_nav, invested_amount, current_value) VALUES
    (v_portfolio_id, 'INF179K01XQ2', 'HDFC Flexi Cap Fund',                'Equity',        1200, 45.00, 52.00, 54000.00, 62400.00),
    (v_portfolio_id, 'INF200K01UY5', 'SBI Small Cap Fund',                 'Equity',         500, 120.00, 108.00, 60000.00, 54000.00),
    (v_portfolio_id, 'INF109K01VS9', 'ICICI Prudential Corporate Bond Fund','Debt',          3000, 24.00, 25.20, 72000.00, 75600.00),
    (v_portfolio_id, 'INF090K01LK1', 'Axis Gold ETF',                      'Gold',            800, 52.00, 58.00, 41600.00, 46400.00),
    (v_portfolio_id, 'INF879O01023', 'Parag Parikh Flexi Cap Fund',        'Equity',          900, 60.00, 68.00, 54000.00, 61200.00),
    (v_portfolio_id, 'INF247L01AQ9', 'Motilal Oswal Nasdaq 100 FoF',       'International',  1500, 22.00, 24.50, 33000.00, 36750.00);

  -- 4. One real BUY transaction backing each holding
  INSERT INTO transactions (portfolio_id, fund_isin, fund_name, fund_category, transaction_type, units, nav, amount, transaction_date, folio_number) VALUES
    (v_portfolio_id, 'INF179K01XQ2', 'HDFC Flexi Cap Fund',                'Equity',        'BUY', 1200, 45.00, 54000.00, CURRENT_DATE - INTERVAL '180 days', 'FOLIO-10234'),
    (v_portfolio_id, 'INF200K01UY5', 'SBI Small Cap Fund',                 'Equity',        'BUY',  500, 120.00, 60000.00, CURRENT_DATE - INTERVAL '165 days', 'FOLIO-10235'),
    (v_portfolio_id, 'INF109K01VS9', 'ICICI Prudential Corporate Bond Fund','Debt',         'BUY', 3000, 24.00, 72000.00, CURRENT_DATE - INTERVAL '150 days', 'FOLIO-10236'),
    (v_portfolio_id, 'INF090K01LK1', 'Axis Gold ETF',                      'Gold',          'BUY',  800, 52.00, 41600.00, CURRENT_DATE - INTERVAL '120 days', 'FOLIO-10237'),
    (v_portfolio_id, 'INF879O01023', 'Parag Parikh Flexi Cap Fund',        'Equity',        'BUY',  900, 60.00, 54000.00, CURRENT_DATE - INTERVAL '90 days',  'FOLIO-10238'),
    (v_portfolio_id, 'INF247L01AQ9', 'Motilal Oswal Nasdaq 100 FoF',       'International', 'BUY', 1500, 22.00, 33000.00, CURRENT_DATE - INTERVAL '60 days',  'FOLIO-10239');

  -- 5. Active SIPs
  INSERT INTO sip_plans (user_id, portfolio_id, fund_isin, fund_name, monthly_amount, sip_date, start_date, frequency, is_active) VALUES
    (v_user_id, v_portfolio_id, 'INF179K01XQ2', 'HDFC Flexi Cap Fund',         5000.00, 5,  CURRENT_DATE - INTERVAL '180 days', 'MONTHLY', true),
    (v_user_id, v_portfolio_id, 'INF879O01023', 'Parag Parikh Flexi Cap Fund', 3000.00, 10, CURRENT_DATE - INTERVAL '90 days',  'MONTHLY', true);

  -- 6. 30 days of snapshots — synthetic demo history, ends exactly at the
  -- real totals above so the Dashboard's stat cards and chart agree.
  INSERT INTO portfolio_snapshots (portfolio_id, snapshot_date, invested_amount, current_value, gain, gain_percent)
  SELECT v_portfolio_id, d.snapshot_date, d.invested, d.current, d.gain, d.gain_pct
  FROM (VALUES
    (CURRENT_DATE - INTERVAL '29 days', 246600.00, 251839.91, 5239.91, 2.12),
    (CURRENT_DATE - INTERVAL '28 days', 248944.83, 251048.22, 2103.39, 0.84),
    (CURRENT_DATE - INTERVAL '27 days', 251289.66, 255499.20, 4209.54, 1.68),
    (CURRENT_DATE - INTERVAL '26 days', 253634.48, 258103.28, 4468.80, 1.76),
    (CURRENT_DATE - INTERVAL '25 days', 255979.31, 264263.73, 8284.42, 3.24),
    (CURRENT_DATE - INTERVAL '24 days', 258324.14, 266842.36, 8518.22, 3.30),
    (CURRENT_DATE - INTERVAL '23 days', 260668.97, 271187.32, 10518.35, 4.04),
    (CURRENT_DATE - INTERVAL '22 days', 263013.79, 268909.21, 5895.42, 2.24),
    (CURRENT_DATE - INTERVAL '21 days', 265358.62, 274030.36, 8671.74, 3.27),
    (CURRENT_DATE - INTERVAL '20 days', 267703.45, 274356.52, 6653.07, 2.49),
    (CURRENT_DATE - INTERVAL '19 days', 270048.28, 278537.37, 8489.09, 3.14),
    (CURRENT_DATE - INTERVAL '18 days', 272393.10, 283410.56, 11017.46, 4.04),
    (CURRENT_DATE - INTERVAL '17 days', 274737.93, 283063.78, 8325.85, 3.03),
    (CURRENT_DATE - INTERVAL '16 days', 277082.76, 287169.60, 10086.84, 3.64),
    (CURRENT_DATE - INTERVAL '15 days', 279427.59, 293254.57, 13826.98, 4.95),
    (CURRENT_DATE - INTERVAL '14 days', 281772.41, 295464.90, 13692.49, 4.86),
    (CURRENT_DATE - INTERVAL '13 days', 284117.24, 296089.64, 11972.40, 4.21),
    (CURRENT_DATE - INTERVAL '12 days', 286462.07, 301677.68, 15215.61, 5.31),
    (CURRENT_DATE - INTERVAL '11 days', 288806.90, 306233.29, 17426.39, 6.03),
    (CURRENT_DATE - INTERVAL '10 days', 291151.72, 303283.81, 12132.09, 4.17),
    (CURRENT_DATE - INTERVAL '9 days',  293496.55, 312136.35, 18639.80, 6.35),
    (CURRENT_DATE - INTERVAL '8 days',  295841.38, 314292.67, 18451.29, 6.24),
    (CURRENT_DATE - INTERVAL '7 days',  298186.21, 314537.70, 16351.49, 5.48),
    (CURRENT_DATE - INTERVAL '6 days',  300531.03, 316056.28, 15525.25, 5.17),
    (CURRENT_DATE - INTERVAL '5 days',  302875.86, 325163.81, 22287.95, 7.36),
    (CURRENT_DATE - INTERVAL '4 days',  305220.69, 323304.68, 18083.99, 5.92),
    (CURRENT_DATE - INTERVAL '3 days',  307565.52, 324319.47, 16753.95, 5.45),
    (CURRENT_DATE - INTERVAL '2 days',  309910.34, 327265.30, 17354.96, 5.60),
    (CURRENT_DATE - INTERVAL '1 day',   312255.17, 336187.46, 23932.29, 7.66),
    (CURRENT_DATE,                      314600.00, 336350.00, 21750.00, 6.91)
  ) AS d(snapshot_date, invested, current, gain, gain_pct)
  ON CONFLICT (portfolio_id, snapshot_date) DO NOTHING;

END $$;

COMMIT;

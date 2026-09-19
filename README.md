# LastStats — AI-Powered Investment Platform

> An AI-assisted portfolio management and simulated algorithmic investment platform for tracking, analyzing, and optimizing Mutual Fund and SIP investments using real market data.

**Status:** 🟢 Phase 1 core + a substantial slice of Phase 2, all functional and verified via a full code-review pass (every page, all three Java services, and the analytics service) — real country-shape World Markets Map (hover now simplified to countries-only; full per-exchange detail lives in the panel below the map), a permanently-archived global news feed with a live "N new articles" banner (RSS-ingested, DB-backed, background-polled), daily portfolio snapshots powering the Dashboard history chart, a Drawdown Analysis panel and a Monte Carlo growth-over-time chart (Algo page), and per-holding XIRR on the Portfolio page. **`npm install` already done in `frontend/`** — nothing pending there. ⚠️ Two SQL migrations (`migration_add_portfolio_snapshots.sql`, `migration_add_news_articles.sql`) are REQUIRED on every volume, including fresh ones — see §6.
**Last updated:** 2026-09-14
**Owner:** Riya Janday
**Location:** `C:\RIYA\internship\laststats`

---

## 1. What This Project Is

LastStats helps users:
- Track mutual fund investments (holdings, transactions, NAV)
- Manage SIP (Systematic Investment Plan) schedules with future value projections
- View live market indices and stock prices (Nifty, Sensex, S&P 500, NASDAQ)
- Run Monte Carlo simulations to forecast portfolio outcomes
- Get AI-powered investment guidance (Groq / Gemini / Claude)

**Target users:** Beginner investors who want guided SIP suggestions, and experienced investors who want to optimize an existing portfolio with algorithmic tools.

**One-line pitch:** *An AI-powered portfolio management platform that tracks mutual fund investments, simulates algorithmic SIP strategies, and helps users optimize portfolios using real market data.*

---

## 2. Full Target Architecture (long-term vision)

This is the complete system as originally designed — Phase 1 (below) implements a working slice of this; the rest is the roadmap.

```
                    React / Next.js Frontend
                         Web & Mobile UI
                                │
                                ▼
              API Gateway (Spring Cloud / Kong)
          Auth · Rate limiting · Routing · Load balancing
                                │
        ┌──────────┬───────────┼───────────┬──────────┐
        ▼          ▼           ▼           ▼          ▼
    Portfolio   SIP Manager  Market Data  Auth/IAM   Notify
   Holdings&P&L Transactions NAV·Live px  JWT·OAuth  Email·Push
        │          │           │           │          │
        └──────────┴───────────┴───────────┴──────────┘
                                │
                    Kafka / RabbitMQ — Event Bus
                                │
        ┌──────────┬───────────┼───────────┐
        ▼          ▼           ▼           ▼
   Finance      Algo-SIP    Monte Carlo  Stock
   Engine       Engine      Portfolio    Suggester
   CAGR·XIRR    Optimize·   Forecast     ML scoring
   ·Risk        Backtest                 ·Rank
        │          │           │           │
        └──────────┴───────────┴───────────┘
                                │
                                ▼
                  AI Investment Assistant
              Claude / OpenAI API · RAG · Prompt layer
                                │
                                ▼
                     External Data Sources
        ┌──────────┬───────────┬───────────┐
        ▼          ▼           ▼           ▼
    MF Central  Yahoo       BSE/NSE     World Markets
    NAV data    Finance     Market      NASDAQ·S&P
                Live prices indices     ·FTSE
                                │
                                ▼
                         Data Layer
        ┌──────────┬───────────┬───────────┐
        ▼          ▼           ▼           ▼
    PostgreSQL  TimescaleDB  Redis       S3/MinIO
    Users·      NAV·Price    Cache·      Reports
    Portfolios  history      Sessions
                                │
                                ▼
    DevOps: Docker · Kubernetes · GitHub Actions · Prometheus + Grafana
```

---

## 3. Tech Stack

| Layer | Technology | Editor |
|---|---|---|
| Frontend | React 18 + Vite + React Router + Tailwind CSS | VS Code |
| Backend (Auth) | Java 21 + Spring Boot 3 + Spring Security + JWT | IntelliJ IDEA |
| Backend (Portfolio) | Java 21 + Spring Boot 3 + JPA | IntelliJ IDEA |
| Backend (SIP) | Java 21 + Spring Boot 3 + JPA | IntelliJ IDEA |
| Backend (Market Data) | Java 21 + Spring Boot 3 + WebFlux (WebClient) | IntelliJ IDEA |
| API Gateway (planned) | Spring Cloud Gateway / Kong | IntelliJ IDEA |
| Analytics | Python 3.12/3.13 + FastAPI + NumPy | VS Code |
| Task queue (planned) | Celery | VS Code |
| Database | PostgreSQL 15 (+ TimescaleDB extension) | Docker |
| Cache | Redis 7 | Docker |
| Event bus (planned) | Kafka / RabbitMQ | Docker |
| Object storage (planned) | S3 / MinIO | — |
| AI (chat) | Groq API (Llama 3.3 70B) — free tier | — |
| AI (analysis) | Google Gemini API — free tier | — |
| AI (originally planned) | Claude / OpenAI API + RAG + prompt layer | — |
| Build tools | Maven (Java), pip (Python), npm (React) | — |
| DevOps (planned) | Docker, Kubernetes, GitHub Actions, Prometheus + Grafana | — |

**Why plain React over Next.js:** Originally scaffolded in Next.js; switched to Vite + React Router mid-project since the user's codebase was already plain React. Vite gives a simpler mental model (no file-based routing, no server components) and faster dev server for this use case.

**Why Groq + Gemini over Claude/OpenAI:** Both offer generous free tiers for a student/internship project. Groq (Llama 3.3 70B) is used for fast conversational chat; Gemini is used for deeper structured portfolio analysis. The original architecture diagram specifies Claude/OpenAI + RAG — that remains the aspirational target if the project moves toward production.

---

## 4. Project Structure (as currently built)

```
C:\RIYA\internship\laststats\
│
├── docker-compose.yml          # PostgreSQL + Redis containers
├── init.sql                    # DB schema — run once after docker up
├── README.md                   # ← this file
│
├── backend\
│   ├── auth-service\           # Port 8081 — register/login/JWT
│   ├── portfolio-service\      # Port 8082 — holdings + transactions
│   ├── sip-service\            # Port 8083 — SIP plans + projections
│   └── market-data-service\    # Port 8084 — live NAV/stock/index prices
│
├── analytics\                  # Port 8090 — Python FastAPI
│   └── app\
│       ├── routers\            # xirr.py, simulation.py
│       └── services\           # xirr_service.py, monte_carlo.py
│
└── frontend\                   # Port 5173 — React (Vite)
    └── src\
        ├── pages\               # DashboardPage, PortfolioPage, SipPage, MarketPage, AlgoPage, AiPage
        ├── components\          # Sidebar
        └── lib\                 # api.js, utils.js
```

---

## 5. Ports Reference

| Service | Port | URL |
|---|---|---|
| Frontend (React/Vite) | 5173 | http://localhost:5173 |
| Auth Service | 8081 | http://localhost:8081 |
| Portfolio Service | 8082 | http://localhost:8082 |
| SIP Service | 8083 | http://localhost:8083 |
| Market Data Service | 8084 | http://localhost:8084 |
| Analytics (Python) | 8090 | http://localhost:8090 |
| PostgreSQL | 5433 (host) → 5432 (container) | — |
| Redis | 6380 (host) → 6379 (container) | — |

---

## 6. How to Run Everything (7 terminals)

```cmd
:: Terminal 1 — Infrastructure
cd C:\RIYA\internship\laststats
docker-compose up -d
docker exec -i ls_postgres psql -U laststats -d laststats < init.sql

:: If this volume existed BEFORE fund_category (transactions) or sip_plans
:: were added, also run the drift-fix migration (safe to re-run anytime):
docker exec -i ls_postgres psql -U laststats -d laststats < migration_fix_schema_drift.sql

:: REQUIRED on every volume (not just old ones) — these two features'
:: tables are NOT in init.sql yet, so a fresh volume needs them too,
:: or portfolio-service / market-data-service fail at startup with
:: "Schema-validation: missing table [portfolio_snapshots]" /
:: "missing table [news_articles]":
docker exec -i ls_postgres psql -U laststats -d laststats < migration_add_portfolio_snapshots.sql
docker exec -i ls_postgres psql -U laststats -d laststats < migration_add_news_articles.sql

:: Terminal 2 — Auth Service
cd C:\RIYA\internship\laststats\backend\auth-service
mvn spring-boot:run

:: Terminal 3 — Portfolio Service
cd C:\RIYA\internship\laststats\backend\portfolio-service
mvn spring-boot:run

:: Terminal 4 — SIP Service
cd C:\RIYA\internship\laststats\backend\sip-service
mvn spring-boot:run

:: Terminal 5 — Market Data Service
cd C:\RIYA\internship\laststats\backend\market-data-service
mvn spring-boot:run

:: Terminal 6 — Analytics (Python)
cd C:\RIYA\internship\laststats\analytics
pip install -r requirements.txt
uvicorn app.main:app --port 8090 --reload

:: Terminal 7 — Frontend
cd C:\RIYA\internship\laststats\frontend
npm run dev
```

Open **http://localhost:5173**

---

## 7. Prerequisites / Installed Tools

- [x] Java JDK 21 — https://adoptium.net
- [x] Maven 3.9+ — https://maven.apache.org/download.cgi
- [x] Node.js — for React/Vite frontend
- [x] Python 3.12/3.13 — https://www.python.org/downloads/
- [x] Docker Desktop — https://www.docker.com/products/docker-desktop
- [x] Git
- [x] IntelliJ IDEA Community — for Java services
- [x] VS Code — for Python + React

---

## 8. Feature Status — Phase 1 Core

### ✅ Done
- [x] Docker infra (PostgreSQL + TimescaleDB, Redis)
- [x] Database schema (`users`, `portfolios`, `holdings`, `transactions`, `sip_plans`, `nav_history`)
- [x] Auth service — register, login, refresh, profile update, password reset, account delete, JWT access + refresh tokens, BCrypt hashing — **fully wired into the frontend**, no demo/fake user anymore
- [x] Portfolio service — create portfolio, add BUY/SELL/SIP/DIVIDEND transactions, auto-recalculate holdings (avg NAV, units, current value); JPA-backed, real per-user scoping via JWT `Authentication`
- [x] SIP service — create/pause/resume SIP plans, 5-year future value projection; **rewritten this session from in-memory storage to JPA-backed persistence**, real per-user scoping
- [x] Market data service — live Nifty 50 / Sensex / S&P 500 / NASDAQ via Yahoo Finance, individual stock quote lookup, `/search` endpoint; intentionally public (no auth)
- [x] Analytics service (Python/FastAPI) — XIRR calculator (Newton-Raphson method), CAGR calculator, Monte Carlo portfolio simulator (Geometric Brownian Motion, 1000 simulations); intentionally public (no auth)
- [x] Frontend — Dashboard, Portfolio, SIP Plans, Markets, Algo Engine, AI Assistant, **Login, Register, Settings** pages (React + Vite + React Router)
- [x] Real JWT auth end-to-end — `lib/auth.js` calls auth-service directly, `lib/api.js` attaches `Authorization: Bearer <token>` to every portfolio/SIP request via an axios interceptor, and a 401 handler clears the session and redirects to `/login`
- [x] CORS preflight (`OPTIONS`) explicitly permitted on all three secured services — required because both `Authorization` and `Content-Type: application/json` trigger browser preflight requests that Spring Security blocks by default
- [x] AI Assistant page — Groq API integration (Llama 3.3 70B), finance-specialized system prompt
- [x] Gemini-based portfolio analysis (deeper structured insights, separate from chat)
- [x] Daily portfolio snapshots (`portfolio-service`'s `SnapshotScheduler`, cron 00:05) — real Dashboard performance-over-time chart via `GET /api/portfolios/history?range=`, plus an on-demand `POST /api/portfolios/{id}/snapshot`
- [x] Global market news — `market-data-service`'s `NewsIngestionScheduler` pulls 11 publisher RSS feeds every 7 min via ROME, dedupes by `sha256(source+title)`, archives permanently (never deletes); `GET /api/news` (paginated, filterable by country/region/category/search) and `POST /api/news/refresh`
- [x] World Markets Map — real country-shape hover (`react-simple-maps` + `world-atlas` 50m topology) driven by the market-data-service's full exchange master list (`GET /api/market/exchanges`), not just a handful of hardcoded countries
- [x] Drawdown Analysis (analytics service) — `POST /api/drawdown/analyze` computes max drawdown %, peak/trough dates, recovery time, and the underwater curve from a portfolio's snapshot history; surfaced in a new panel on the Algo page
- [x] Bug fixes (validation-error-leak in auth/portfolio/sip-service, unencoded query string in `PortfolioPage.jsx`) — confirmed in place across all three Java services and the frontend on re-verification
- [x] Portfolio page — per-holding XIRR column next to Gain %, computed from each fund's real transaction history (BUY/SIP as invested, SELL/DIVIDEND as returned) via the already-existing `POST /api/xirr/calculate`; closed the gap where the Landing page advertised XIRR but no page actually called it
- [x] Algo page (Monte Carlo) — real P10–P90 growth-over-time chart (recharts) using `chart_data` the backend was already computing and the frontend was discarding; paired numeric inputs next to every slider, a Reset-to-defaults button, and a disabled/warned state when both Portfolio Value and Monthly SIP are 0
- [x] Global Market News — background poll (60s, page-1/no-filter view only) surfaces a dismissible "N new articles just published" banner when the DB-backed, `published_at DESC`-ordered archive gets new rows from the 7-minute ingestion scheduler, without ever auto-reloading the list out from under the reader
- [x] World Markets Map — hover simplified to country name + exchange count only (per-exchange live prices moved out of the hover tooltip; still available in the "All tracked exchanges" panel below the map)

### 🟡 Simplified / Known Shortcuts (intentional for Phase 1)
- No API Gateway — frontend calls each backend service directly on its own port
- No automatic access-token refresh — access tokens last 24h (`jwt.expiration` in auth-service); on expiry the user is bounced to `/login` rather than silently refreshed via the refresh token
- Redis container runs but isn't actually used by any service yet — no JWT blacklist, no caching layer (this differs from the original spec, which planned Redis-backed logout/blacklisting)
- No Kafka/RabbitMQ event bus yet — services don't communicate asynchronously
- AI Assistant calls Groq directly from the browser (API key exposed in `.env` — fine for local dev, **not for production**)
- Settings page's email field is read-only — there's no email-change endpoint on the backend yet

---

## 9. Full Feature Backlog (from original brainstorm)

This is the complete feature set discussed and designed, organized by category. Phase 1 above implements a working slice; everything below is roadmap.

### Smart Analytics & Insights
| Feature | Tag | Description |
|---|---|---|
| Tax loss harvesting | Advanced | Flag underperforming funds to sell before year-end to offset capital gains |
| Correlation matrix | Advanced | Show how funds move together — spot over-diversification or hidden risk clusters |
| Drawdown analysis | ✅ Done | Maximum drawdown, recovery time, underwater equity curve — `POST /api/drawdown/analyze`, Algo page panel. Currently portfolio-level (from snapshot history); per-fund NAV-history drawdown is still open |
| Risk-adjusted metrics | Advanced | Sharpe, Sortino, Treynor ratios — return per unit of risk taken |
| Goal tracker | New | Set targets (house, retirement, education) and track progress with projections |
| Real return view | New | Inflation-adjusted CAGR and purchasing power erosion over time |

### Trading & Market Features
| Feature | Tag | Description |
|---|---|---|
| Watchlist + alerts | New | Track stocks/funds not yet owned; push/email alerts on price targets |
| Paper trading mode | Advanced | Simulated buy/sell with virtual money using real prices — zero-risk practice |
| Technical indicators | Advanced | RSI, MACD, Bollinger Bands, moving averages on live stock charts |
| Options chain viewer | Advanced | Display puts/calls, OI, IV, Greeks for F&O traders |
| Market depth (L2) | Advanced | Bid/ask ladder, order book visualization for active traders |
| Asset screener | New | Filter stocks and MFs by PE, CAGR, AUM, rating, sector, expense ratio |

### Algo Trading & Automation
| Feature | Tag | Description |
|---|---|---|
| Strategy backtester | Advanced | Test buy/sell rules on historical data with slippage and commission modeling |
| No-code strategy builder | New | Drag-and-drop rules — e.g. "if RSI < 30 AND price above 200DMA, buy" |
| Auto-rebalancing | Advanced | Scheduled or threshold-based rebalancing with drift alerts |
| Live execution bridge | Advanced | Connect to Zerodha/Upstox/Angel One Kite API for real order placement |
| Walk-forward optimizer | Advanced | Prevent overfitting by testing strategies on unseen rolling windows |

### AI & Personalization
| Feature | Tag | Description |
|---|---|---|
| Weekly AI digest | New | Auto-generated summary — best/worst performers, news impact, action items |
| News sentiment engine | Advanced | NLP scoring of headlines — bullish/bearish per stock with impact prediction |
| Risk profiling quiz | New | Onboarding questionnaire to assess risk appetite and suggest fund allocation |
| Expense-to-invest nudge | New | AI spots spending patterns and suggests redirecting to SIPs |
| Benchmark comparison | New | Compare portfolio vs Nifty 50, S&P 500, or a custom index |

### Social & Community
| Feature | Tag | Description |
|---|---|---|
| Portfolio leaderboard | Social | Opt-in public rankings by returns — anonymous or named profiles |
| Copy investing | Social | Follow top performers and mirror their SIP allocations with one click |
| Investment clubs | Social | Group portfolios — family SIPs, friend pools, or managed sub-accounts |
| Learn & earn | Social | Mini-courses on SIP, MF basics, taxes — quiz to unlock premium features |

### UX & Platform
| Feature | Tag | Description |
|---|---|---|
| Dark mode + themes | UX | Light/dark/system + color themes for accessibility and comfort |
| Report export | UX | PDF/Excel export of gains, XIRR, tax report, capital gains statement |
| CAS/CAMS import | New | Auto-import existing MF portfolio from CAMS/Karvy consolidated statement |
| Multi-currency view | New | Track global investments in USD, EUR, INR with live FX conversion |
| Mobile app | UX | React Native or Flutter app with biometric login and home-screen widget |
| Audit trail | UX | Every trade, change, and AI recommendation logged with timestamps |

---

## 10. Phased Roadmap (original 12-month plan)

| Phase | Timeline | Focus |
|---|---|---|
| **Phase 1** | Months 1–2 | Foundation — auth, portfolio CRUD, SIP manager, CAS import, XIRR/CAGR engine, Docker dev setup, CI/CD skeleton |
| **Phase 2** | Months 3–4 | Analytics & Market — drawdown, risk-adjusted metrics, correlation matrix, Monte Carlo, live world markets, asset screener, watchlist, benchmark comparison |
| **Phase 3** | Months 5–6 | AI + Trading — AI investment assistant (RAG), weekly digest, news sentiment, risk quiz, paper trading, candlestick charts, broker API bridge, options chain, market depth |
| **Phase 4** | Months 7–9 | Algo Engine — Algo-SIP optimizer (MPT), auto-rebalancing, tax loss harvesting, strategy backtester, no-code strategy builder, walk-forward optimizer, goal tracker, multi-currency, expense-to-invest nudge |
| **Phase 5** | Months 10–12 | Social + Scale — leaderboard, copy investing, investment clubs, learn & earn, report export, mobile app, dark mode, audit trail, Kubernetes, Prometheus + Grafana, ELK logging, Redis caching strategy |

**Where the current build stands:** Roughly a working slice of Phase 1 + a taste of Phase 2 (Monte Carlo) and Phase 3 (AI assistant), built directly in code rather than following the month-by-month order — reasonable for an internship/learning project where hands-on breadth matters more than strict sequencing.

---

## 11. Database Schema Summary

| Table | Purpose |
|---|---|
| `users` | Auth — email, password hash, role, risk profile |
| `portfolios` | One or more portfolios per user |
| `holdings` | Current fund positions per portfolio (units, avg NAV, current value) |
| `transactions` | Immutable history log of every BUY/SELL/SIP/DIVIDEND |
| `sip_plans` | Recurring SIP configuration (amount, date, active/paused) |
| `nav_history` | Time-series NAV data (TimescaleDB hypertable — not yet populated/used) |
| `portfolio_snapshots` | One row per portfolio per day (invested/current/gain) — powers the Dashboard history chart; added via `migration_add_portfolio_snapshots.sql` |
| `news_articles` | Permanent, append-only archive of ingested RSS headlines — added via `migration_add_news_articles.sql` |

---

## 12. API Endpoints Reference (as built)

### Auth Service (8081)
```
POST   /api/auth/register        { email, password, fullName, phone }
POST   /api/auth/login           { email, password }
POST   /api/auth/refresh         header: X-Refresh-Token
POST   /api/auth/logout          (stateless — frontend just discards tokens)
PUT    /api/auth/profile         auth required, body: { fullName, phone, riskProfile }
POST   /api/auth/reset-password  auth required, body: { currentPassword, newPassword }
DELETE /api/auth/account         auth required
```
All routes except register/login/refresh require `Authorization: Bearer <accessToken>`.

### Portfolio Service (8082) — all routes require `Authorization: Bearer <accessToken>`
```
GET  /api/portfolios
POST /api/portfolios?name=...
POST /api/portfolios/{id}/transactions        body: AddTransactionRequest
GET  /api/portfolios/{id}/transactions
GET  /api/portfolios/history?range=1W|1M|3M|1Y|ALL   combined snapshot history across all the user's portfolios
POST /api/portfolios/{id}/snapshot                    force a snapshot right now (nightly job also runs this at 00:05)
```

### SIP Service (8083) — all routes require `Authorization: Bearer <accessToken>`
```
GET   /api/sips                               list all SIPs for the current user
POST  /api/sips?portfolioId=...               body: CreateSipRequest (portfolioId optional)
GET   /api/sips/portfolio/{portfolioId}
POST  /api/sips/portfolio/{portfolioId}       body: CreateSipRequest
PATCH /api/sips/{sipId}/pause
PATCH /api/sips/{sipId}/resume
GET   /api/sips/{sipId}/projection?years=5&annualReturnPct=12
```

### Market Data Service (8084) — public, no auth
```
GET  /api/market/indices
GET  /api/market/world-indices
GET  /api/market/exchanges                    full exchange master list + live quotes where available — backs the World Markets Map
GET  /api/market/search?q=...
GET  /api/market/quote/{symbol}               e.g. RELIANCE.NS, ^NSEI
POST /api/market/quotes                       body: ["RELIANCE.NS", "TCS.NS"]
```

### News (also market-data-service, port 8084) — public, no auth
```
GET  /api/news?country=India&category=Stocks&search=rbi&page=1&limit=20
POST /api/news/refresh                        fetches all RSS sources, inserts only new articles, returns { newArticles, totalArticles }
```

### Analytics Service (8090)
```
POST /api/xirr/calculate                      body: { cashflows[], current_value, current_date }
POST /api/simulation/monte-carlo              body: { current_value, monthly_sip, years, annual_return_pct, annual_volatility_pct, simulations }
POST /api/drawdown/analyze                    body: { series: [{ date, value }, ...] } — max drawdown %, peak/trough dates, recovery, underwater curve
GET  /health
```

---

## 13. Key Design Decisions & Why

| Decision | Reasoning |
|---|---|
| Microservices (not monolith) | Analytics (Python, math-heavy) is a fundamentally different workload from transactional services (Java, DB-heavy) — splitting lets each scale/optimize independently |
| Real JWT auth from the start of Phase 1 | Each service independently validates the JWT issued by auth-service (shared `jwt.secret`) rather than trusting a client-supplied user ID header — closer to how the target architecture's Auth/IAM box is meant to work, and removes an entire class of "forgot to wire real auth" bugs later |
| No API Gateway yet | Simpler local dev — each service reachable directly; gateway can be layered in later without changing service code |
| Explicit `OPTIONS` permit-all in each Spring Security config | Browsers preflight any cross-origin request carrying `Authorization` or a non-simple `Content-Type` (e.g. `application/json`) with an `OPTIONS` request that carries no auth header — without explicitly permitting it, `.anyRequest().authenticated()` blocks the preflight and the browser reports it as a CORS failure |
| XIRR via Newton-Raphson | SIP investments have irregular cash flows on different dates — CAGR (single lump sum formula) doesn't apply; XIRR requires iterative solving |
| Monte Carlo via Geometric Brownian Motion | Standard model for simulating investment growth — gives a realistic *range* of outcomes (P10/P50/P90) instead of one misleading single prediction |
| Groq for AI chat | Free tier, extremely fast inference (Llama 3.3 70B), good enough quality for finance Q&A |
| Gemini for portfolio analysis | Free tier, strong at structured, longer-form analytical output vs quick chat |
| React + Vite (switched from Next.js) | Original codebase was plain React; Vite gives faster dev server and simpler mental model (no file-based routing, no server components) |
| CAS/CAMS import prioritized in roadmap | Removes the #1 onboarding friction — user pastes existing consolidated statement instead of manually re-entering years of transactions |

---

## 14. Related / Adjacent Project — RAG Chatbot

A separate resume project (**RAG-Based Document Chatbot**, listed alongside FinSight AI) shares AI concepts with LastStats but is a distinct system:

- **Stack:** LangChain + FAISS + Streamlit + LLM API
- **What it does:** Upload a document → it's chunked → each chunk converted to an embedding → stored in FAISS → user question also embedded → FAISS retrieves most relevant chunks → chunks + question sent to LLM → grounded answer returned (not hallucinated)
- **Relevance to LastStats:** Could eventually power the "AI Investment Assistant" box in the target architecture (Section 2) by grounding answers in real fund fact sheets / SEBI documents instead of general LLM knowledge — currently LastStats's AI features (Groq chat, Gemini analysis) do **not** use retrieval; they rely on the base model's training + a system prompt only.

---

## 15. AI Concepts Reference (for interview / viva prep)

Quick definitions kept handy — see full theory covered in project chat history:
- **Microservices vs Monolith**, **JWT (access vs refresh token)**, **BCrypt hashing**, **Dependency Injection**, **Repository pattern**, **DTOs**
- **XIRR vs CAGR** — XIRR for irregular SIP cashflows (Newton-Raphson), CAGR for lump sum
- **Monte Carlo Simulation** — Geometric Brownian Motion, percentile bands (P10/P50/P90), Sharpe/Sortino ratios, Modern Portfolio Theory
- **RAG (Retrieval-Augmented Generation)** — embeddings, FAISS, semantic search, LangChain, context-aware generation
- **AI taxonomy** — Narrow AI vs General AI vs Super AI; Reactive Machines vs Limited Memory vs Theory of Mind; Machine Learning vs Deep Learning vs NLP vs Generative AI vs Computer Vision vs Reinforcement Learning

---

## 16. Troubleshooting Log

*(Add a dated row every time an issue comes up and gets resolved)*

| Date | Issue | Fix |
|---|---|---|
| — | `npm run dev` run from wrong folder → `package.json not found` | Always `cd` into `frontend` before running npm commands |
| — | `Cannot find module '@/store'` | Leftover Next.js path alias; removed when switching to plain React (no `@/` aliases needed with Vite unless configured) |
| — | Pages returning 404 (sip, trading, algo, ai, settings) | Page files didn't exist yet — created missing route files |
| — | Tailwind v4 required different `@import` syntax | Standardized on Tailwind v3 config style (`tailwind.config.js` + `@tailwind base/components/utilities`) |
| — | Market data service port mismatch (8085 vs 8084) | Standardized on 8084 everywhere (backend `application.yml` + frontend `.env`) |
| 2026-08-27 | sip-service `mvn spring-boot:run` failed: `Schema-validation: missing table [sip_plans]` | Volume was created before `sip_plans` existed in `init.sql`; wrote `migration_fix_schema_drift.sql` (create-if-missing + backfill) and reran against the live container |
| 2026-08-27 | portfolio-service failed: `Schema-validation: missing column [fund_category] in table [transactions]` | Same root cause as above — volume predated that column; fixed by the same migration script |
| 2026-08-27 | `docker-compose up -d` failed: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine` | Docker Desktop's engine wasn't fully started yet when the command ran; a container from an earlier run was still up and reachable on port 5432, so the immediate fix was just waiting for Docker Desktop to finish starting before rerunning compose |
| 2026-08-28 | sip-service was fully in-memory (`Map<UUID, SipState>`) despite having a `SipPlan` JPA entity and repository already scaffolded; its `SecurityConfig` was also entirely missing, so `JwtAuthFilter` was never registered | Rewrote `SipService`/`SipController` to use `SipPlanRepository`, added the missing `SecurityConfig`, added `GlobalExceptionHandler` and `ApiResponse.error()` |
| 2026-08-28 | Frontend `lib/auth.js` stored plaintext passwords in `localStorage` and never called auth-service; `lib/api.js` sent a fake `X-User-Id` header | Rewrote both to use real JWT (`Authorization: Bearer <token>`), added a 401 interceptor that clears the session and redirects to `/login` |
| 2026-08-28 | Every JSON `POST`/`PUT`/`DELETE` to auth/portfolio/sip services would have failed from the browser with a CORS error | `Content-Type: application/json` and `Authorization` both trigger a preflight `OPTIONS` request with no auth header attached; none of the three `SecurityConfig`s explicitly permitted `OPTIONS`, so `.anyRequest().authenticated()` blocked the preflight itself. Added `.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()` to all three |
| 2026-08-28 | Host port 5432 already in use (another Postgres install/instance), so the Docker Postgres container needed to publish on a different host port | Changed `docker-compose.yml` to `"5433:5432"` (host:container) and updated `jdbc:postgresql://localhost:5432/...` to `:5433` in all three services' `application.yml` (auth, portfolio, sip). Note: `docker exec -i ls_postgres psql ...` commands are unaffected — they connect inside the container's network, always on 5432 |
| 2026-08-28 | Host port 6379 already in use (FraudGuard's Redis, a separate project on the same machine), collided with LastStats's Redis container | Changed `docker-compose.yml` to `"6380:6379"` (host:container). No code change needed — confirmed no service actually connects to Redis yet (no `spring-boot-starter-data-redis` dependency, no redis config block in any `application.yml`) |
| 2026-09-13 | README's §6 run instructions and §17 TODO were stale relative to the actual code — `react-simple-maps` install was already done, and a fully-built News feature + portfolio-snapshots feature existed with zero mention in the doc. Also, `migration_add_portfolio_snapshots.sql` and `migration_add_news_articles.sql` existed on disk but were never listed as a required run step, so a fresh volume would hit `Schema-validation: missing table [portfolio_snapshots]` / `[news_articles]` — the same class of bug as the 2026-08-27 schema-drift entries above | Rewrote §6, §8, §9, §11, §12 to document what's actually built; added the two missing migrations to the run steps. Also fixed a stale pom.xml comment that listed Reuters as an ingested source when `NewsFeedRegistry` deliberately excludes it |
| 2026-09-14 | Full code-review pass across every page and service found the codebase essentially complete and bug-free, with one real gap: `xirr.py`/`xirr_service.py` (analytics) had a working `POST /api/xirr/calculate` endpoint that zero frontend pages called, despite the Landing page advertising "XIRR & CAGR" as a feature | Wired it into `PortfolioPage.jsx` as a per-holding XIRR column (see §8) — no backend changes needed, everything required already existed |
| 2026-09-14 | Algo page's Monte Carlo endpoint (`monte_carlo.py`) already computed and returned `chart_data` (P10/P50/P90 sampled every 3rd month) but `AlgoPage.jsx` never rendered it — only a static end-of-period range bar | Added a recharts `ComposedChart` growth-over-time visualization; also fixed a latent bug where "Outcome range after N years" read the *live* slider value instead of the params that actually produced the displayed result (now uses a separate `resultParams` snapshot taken at run time) |
| 2026-09-14 | Markets page news pagination/archival requirements (DB-backed, `ORDER BY published_at DESC`, 1-indexed `page`/`limit`, refresh-only-inserts-never-deletes) were already fully implemented correctly on inspection — the one gap was the frontend never noticing new articles landing from the 7-min background scheduler without a manual click or page reload | Added a silent 60s poll (page-1/no-filter view only) that surfaces a dismissible "N new articles" banner instead of auto-reloading |
| 2026-09-14 | World Markets Map hover tooltip showed full per-exchange live data (name, value, % change) for every exchange in a country — more detail than wanted for a quick hover interaction | Simplified hover to country name + exchange count only; full per-exchange detail remains available in the "All tracked exchanges" panel already below the map |
| 2026-09-14 | `frontend/.env` (holding a live Groq API key) was not covered by `frontend/.gitignore`, so it was eligible to be committed | Added `.env` to `frontend/.gitignore`. Note: this does **not** scrub any prior commit — if `.env` was already committed at any point, the key should be rotated (same treatment as the pending Twelve Data key rotation below) |

---

## 17. Next Session TODO

*(Rewrite this list at the end of every session so you always know where to resume)*

### Completed 2026-09-14: full code-review pass + XIRR wiring + simulation chart + news live-polling + map simplification

A complete read-through review was done across every frontend page, all three Java services, and the analytics service (endpoint-by-endpoint, entity-vs-migration, dependency checks). Everything held up as complete and consistent except one real gap (XIRR was backend-complete but frontend-unwired), which is now fixed. See the 2026-09-14 Troubleshooting Log entries above for full detail on each item:

1. Re-verified the validation-error-leak fix and `PortfolioPage.jsx` URL-encoding fix (from a still-earlier session) are genuinely in place across all three Java services.
2. Wired the already-built XIRR analytics endpoint into `PortfolioPage.jsx` (per-holding XIRR column).
3. Added the Monte Carlo growth-over-time chart to `AlgoPage.jsx`, plus input polish (paired numeric entry, Reset button, 0/0 guard) and a correctness fix so the results panel can't drift out of sync with slider changes made after a run.
4. Added a live "N new articles" banner to the Markets page news feed (background poll, no auto-reload).
5. Simplified the World Markets Map hover to countries-only.
6. Found `frontend/.env` (live Groq key) wasn't gitignored — added it to `.gitignore`.

**Remaining known gaps (roughly the last 2-3% of the project, by my own estimate):**
- [ ] `MarketController`'s legacy `GET /api/market/news` endpoint is dead code (nothing calls it since `NewsController`'s `/api/news` took over) — safe to delete
- [ ] Nothing has actually been run end-to-end in a browser during this review — all verification was static code reading (endpoint matching, entity/migration matching, dependency checks). Still needs an actual `docker-compose up` + all 7 terminals + manual click-through to catch what static review structurally can't (env issues, real provider rate limits, actual runtime errors)
- [ ] If `frontend/.env` was ever committed before today's `.gitignore` fix, rotate the Groq key — adding it to `.gitignore` doesn't scrub git history
- [ ] Per-fund NAV-history drawdown (vs. current portfolio-level) — `nav_history` table exists but nothing writes to it yet
- [ ] Underwater curve isn't charted yet (still summary stat cards only) — the recharts pattern from the new Algo growth chart could be reused directly

### Other outstanding items (pre-existing, still valid)
- [ ] Confirm all 4 Java services start clean after `migration_fix_schema_drift.sql` **and** the two now-documented migrations (`migration_add_portfolio_snapshots.sql`, `migration_add_news_articles.sql`) — see §6
- [ ] Test full flow **in the actual browser UI** (not Postman): register → login → create portfolio → add transaction → view dashboard → create SIP → run Monte Carlo → check the new XIRR column → update profile → reset password
- [ ] `frontend/.env`'s `VITE_GROQ_API_KEY` is already set (not actually missing, despite what this TODO said before) — just needs an end-to-end click-through test of the AI Assistant page to confirm it's still a valid key
- [ ] Decide on an access-token refresh strategy (silent refresh via the refresh token vs. current behavior of just bouncing to `/login` on 401)
- [ ] Rotate the Twelve Data API key if that hasn't been done yet (old key was committed to git history) — set the new one via `TWELVEDATA_API_KEY`
- [ ] Pick the next Phase 2 backlog item (suggest: **watchlist + alerts** or **risk-adjusted metrics / Sharpe & Sortino**, both self-contained)
- [ ] Consider adding API Gateway once core flow is stable

---

## 18. Useful Links

- Groq API keys: https://console.groq.com
- Gemini API keys: https://aistudio.google.com/app/apikey
- Yahoo Finance quote format reference: `https://query1.finance.yahoo.com/v8/finance/quote?symbols=SYMBOL`
- Maven Central (dependency versions): https://mvnrepository.com
- PyPI (Python package versions): https://pypi.org
- Zerodha Kite Connect API (for future broker integration): https://kite.trade/docs/connect/v3/

---

*Keep this file updated — add a dated entry every time you make a meaningful change, fix a bug, or finish a feature. Future-you (and anyone reviewing this project) will thank you.*

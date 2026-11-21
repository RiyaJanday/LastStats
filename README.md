# LastStats — Run Guide

## What's inside
```
laststats/
├── docker-compose.yml          # PostgreSQL + Redis containers
├── init.sql                    # Database tables — run this once
├── backend/
│   ├── auth-service/           # Port 8081 — register/login/JWT
│   ├── portfolio-service/      # Port 8082 — holdings + transactions
│   ├── sip-service/            # Port 8083 — SIP plans
│   └── market-data-service/    # Port 8084 — live stock/index prices
├── analytics/                  # Port 8090 — Python XIRR/Monte Carlo
└── frontend/                   # Port 3000 — Next.js UI
```

## STEP 1 — Start the database

Open Command Prompt in the `laststats` folder:

```cmd
cd C:\RIYA\internship\laststats
docker-compose up -d
```

Wait 10 seconds, then create the tables:

```cmd
docker exec -i ls_postgres psql -U laststats -d laststats < init.sql
```

Verify tables exist:
```cmd
docker exec -it ls_postgres psql -U laststats -d laststats -c "\dt"
```
You should see 5 tables: users, portfolios, holdings, transactions, sip_plans.

## STEP 2 — Run each backend service (separate terminal windows)

**Terminal 1 — Auth Service**
```cmd
cd C:\RIYA\internship\laststats\backend\auth-service
mvn spring-boot:run
```
Wait for: `Started AuthServiceApplication`

**Terminal 2 — Portfolio Service**
```cmd
cd C:\RIYA\internship\laststats\backend\portfolio-service
mvn spring-boot:run
```

**Terminal 3 — SIP Service**
```cmd
cd C:\RIYA\internship\laststats\backend\sip-service
mvn spring-boot:run
```

**Terminal 4 — Market Data Service**
```cmd
cd C:\RIYA\internship\laststats\backend\market-data-service
mvn spring-boot:run
```

## STEP 3 — Run the Python analytics service

**Terminal 5**
```cmd
cd C:\RIYA\internship\laststats\analytics
pip install -r requirements.txt
uvicorn app.main:app --port 8090 --reload
```
Wait for: `Application startup complete`

## STEP 4 — Run the frontend

**Terminal 6**
```cmd
cd C:\RIYA\internship\laststats\frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

## Test it works

1. Go to **Portfolio** page → click **Create Portfolio**
2. Click **Add Transaction** → fill in any fund details, e.g.:
   - Fund ISIN: `INF090I01239`
   - Fund Name: `HDFC Flexi Cap Fund`
   - Units: `10`
   - NAV: `1000`
   - Amount: `10000`
3. Go to **Dashboard** → you should see the holding appear
4. Go to **SIP Plans** → create a SIP, see 5-year projection
5. Go to **Algo Engine** → run a Monte Carlo simulation
6. Go to **Markets** → see live Nifty/Sensex/S&P/NASDAQ prices

## Important notes for this runnable version

- **No login screen** — every request uses a fixed demo user ID so you can test immediately without building auth UI. The auth-service backend IS fully functional (register/login endpoints work via Postman/Thunder Client), it's just not wired into the frontend UI yet.
- **No API Gateway** — frontend calls each backend service directly on its own port (8081-8084). This is simpler for local development; a gateway can be added later for production.
- Each service uses its own `pom.xml`/`requirements.txt` — Maven and pip will download dependencies on first run, which takes 1-3 minutes.

## Ports reference

| Service | Port |
|---|---|
| Frontend | 3000 |
| auth-service | 8081 |
| portfolio-service | 8082 |
| sip-service | 8083 |
| market-data-service | 8084 |
| analytics (Python) | 8090 |
| PostgreSQL | 5432 |
| Redis | 6379 |

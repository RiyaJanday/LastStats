@echo off
setlocal
set ROOT=%~dp0

echo ============================================
echo  LastStats - Starting full stack
echo ============================================

echo.
echo [1/8] Starting Docker infra (Postgres + Redis)...
cd /d "%ROOT%"
docker-compose up -d
if errorlevel 1 (
    echo Docker failed to start. Is Docker Desktop running?
    pause
    exit /b 1
)

echo.
echo [2/8] Waiting for Postgres to become healthy...
:waitpg
docker exec ls_postgres pg_isready -U laststats >nul 2>&1
if errorlevel 1 (
    timeout /t 2 >nul
    goto waitpg
)
echo Postgres is ready.

echo.
echo [3/8] Applying base schema (init.sql)...
docker exec -i ls_postgres psql -U laststats -d laststats < "%ROOT%init.sql"

echo.
echo [4/8] Applying migrations (safe to re-run)...
docker exec -i ls_postgres psql -U laststats -d laststats < "%ROOT%migration_fix_schema_drift.sql"
docker exec -i ls_postgres psql -U laststats -d laststats < "%ROOT%migration_add_portfolio_snapshots.sql"
docker exec -i ls_postgres psql -U laststats -d laststats < "%ROOT%migration_add_news_articles.sql"
docker exec -i ls_postgres psql -U laststats -d laststats < "%ROOT%migration_add_user_id.sql"

echo.
echo [5/8] Launching Auth Service (8081)...
start "LastStats - Auth Service (8081)" cmd /k "cd /d "%ROOT%backend\auth-service" && mvn spring-boot:run"
timeout /t 12 >nul

echo [6/8] Launching Portfolio Service (8082)...
start "LastStats - Portfolio Service (8082)" cmd /k "cd /d "%ROOT%backend\portfolio-service" && mvn spring-boot:run"
timeout /t 12 >nul

echo [7/8] Launching SIP Service (8083)...
start "LastStats - SIP Service (8083)" cmd /k "cd /d "%ROOT%backend\sip-service" && mvn spring-boot:run"
timeout /t 12 >nul

echo Launching Market Data Service (8084)...
start "LastStats - Market Data Service (8084)" cmd /k "cd /d "%ROOT%backend\market-data-service" && mvn spring-boot:run"
timeout /t 12 >nul

echo [8/8] Launching Analytics (Python, 8090)...
start "LastStats - Analytics (8090)" cmd /k "cd /d "%ROOT%analytics" && pip install -r requirements.txt && uvicorn app.main:app --port 8090 --reload"
timeout /t 8 >nul

echo Launching Frontend (5173)...
start "LastStats - Frontend (5173)" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo ============================================
echo  All services launching in separate windows.
echo  Frontend will be at http://localhost:5173
echo  Give the Java services ~20-30s to boot before
echo  hitting the frontend (Spring Boot cold start).
echo ============================================
echo.
pause

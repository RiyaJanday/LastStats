@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0

echo ============================================
echo  LastStats - Stopping full stack
echo ============================================

echo.
echo [1/2] Killing processes on service ports...
for %%P in (8081 8082 8083 8084 8090 5173) do (
    echo   Port %%P:
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        echo     killing PID %%A
        taskkill /F /PID %%A >nul 2>&1
    )
)

echo.
echo [2/2] Stopping Docker containers (Postgres + Redis)...
cd /d "%ROOT%"
docker-compose down

echo.
echo ============================================
echo  All services stopped. Docker containers down.
echo  (Terminal windows opened by start-all.bat may
echo   still be sitting open - close them manually,
echo   they're just idle shells now.)
echo ============================================
echo.
pause

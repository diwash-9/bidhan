@echo off
setlocal
echo ==========================================
echo Starting Bidhan (Constitution of Nepal App)
echo ==========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running or not installed. 
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/2] Building and starting Docker containers...
docker compose up --build -d

echo [2/2] Waiting for services to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo [SUCCESS] App is up and running!
echo ==========================================
echo - Frontend App: http://localhost:5173
echo - Backend API:  http://localhost:8000/docs
echo.
echo To stop the app, run: docker compose down
echo ==========================================
pause

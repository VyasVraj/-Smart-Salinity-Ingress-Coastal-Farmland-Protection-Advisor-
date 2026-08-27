@echo off
echo.
echo ================================================
echo  SALINITY SHIELD AI - Starting Application
echo  Gujarat Hackathon 2026
echo ================================================
echo.

:: Check server .env
if not exist "server\.env" (
  echo [WARNING] server\.env not found.
  echo  Copy server\.env.example to server\.env and configure it.
  echo  Running in demo mode without IBM Granite AI.
  echo.
)

echo Starting Backend Server (port 5000)...
start "Salinity Shield - Backend" cmd /k "cd /d %~dp0server && echo Starting backend... && node src/server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend (port 5173)...
start "Salinity Shield - Frontend" cmd /k "cd /d %~dp0client && echo Starting frontend... && npm run dev"

echo.
echo ================================================
echo  Application starting...
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo  API:      http://localhost:5000/api/health
echo.
echo  Both terminal windows will remain open.
echo  Close them to stop the application.
echo ================================================
echo.

timeout /t 4 /nobreak >nul
start http://localhost:5173

echo Press any key to exit this window (servers continue running)...
pause >nul

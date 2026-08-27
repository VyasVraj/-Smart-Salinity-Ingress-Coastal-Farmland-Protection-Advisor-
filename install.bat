@echo off
echo.
echo ================================================
echo  SALINITY SHIELD AI - Install Dependencies
echo  Gujarat Hackathon 2026
echo ================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=1,2,3 delims=." %%a in ('node --version') do (
  set NODE_MAJOR=%%a
)
set NODE_MAJOR=%NODE_MAJOR:v=%
echo [OK] Node.js %NODE_MAJOR% detected

:: Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm not found.
  pause
  exit /b 1
)
echo [OK] npm detected

echo.
echo [1/2] Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Server install failed
  cd ..
  pause
  exit /b 1
)
echo [OK] Server dependencies installed

echo.
echo [2/2] Installing client dependencies...
cd ../client
call npm install
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Client install failed
  cd ..
  pause
  exit /b 1
)
echo [OK] Client dependencies installed
cd ..

echo.
echo ================================================
echo  Installation complete!
echo.
echo  NEXT STEPS:
echo  1. Copy server\.env.example to server\.env
echo  2. Set DATABASE_URL in server\.env
echo  3. Set IBM credentials in server\.env
echo  4. Run: cd server && npx prisma db push
echo  5. Run: cd server && node prisma/seed.js
echo  6. Double-click run.bat to start the app
echo ================================================
echo.
pause

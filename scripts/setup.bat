@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  CRM Task Management - Windows Setup
echo ========================================================
echo.

:: 1. Check Node.js and npm
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js 20+ from https://nodejs.org/
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found. Please ensure npm is installed and in your PATH.
    exit /b 1
)

echo [OK] Node.js version:
node -v
echo [OK] npm version:
npm -v
echo.

:: 2. Setup Backend
echo --------------------------------------------------------
echo  [1/2] Configuring Backend
echo --------------------------------------------------------
cd backend

if not exist .env (
    if exist .env.example (
        echo [INFO] Creating backend/.env from .env.example...
        copy .env.example .env >nul
        echo [OK] backend/.env created.
    ) else (
        echo [WARN] backend/.env.example not found!
    )
) else (
    echo [INFO] backend/.env already exists, skipping.
)

if not exist uploads (
    echo [INFO] Creating uploads directory...
    mkdir uploads
)

echo [INFO] Installing backend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend dependencies!
    cd ..
    exit /b %ERRORLEVEL%
)

echo [INFO] Running backend typecheck...
call npm run typecheck
if %ERRORLEVEL% neq 0 (
    echo [WARN] Backend typecheck encountered issues.
)

cd ..

:: 3. Setup Frontend
echo.
echo --------------------------------------------------------
echo  [2/2] Configuring Frontend
echo --------------------------------------------------------
cd frontend

if not exist .env (
    if exist .env.example (
        echo [INFO] Creating frontend/.env from .env.example...
        copy .env.example .env >nul
        echo [OK] frontend/.env created.
    ) else (
        echo [WARN] frontend/.env.example not found!
    )
) else (
    echo [INFO] frontend/.env already exists, skipping.
)

echo [INFO] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies!
    cd ..
    exit /b %ERRORLEVEL%
)

echo [INFO] Running frontend typecheck...
call npm run typecheck
if %ERRORLEVEL% neq 0 (
    echo [WARN] Frontend typecheck encountered issues.
)

cd ..

echo.
echo ========================================================
echo  Setup Completed Successfully!
echo ========================================================
echo.
echo Next steps:
echo   1. Review backend/.env and set your MongoDB URI and JWT_SECRET
echo   2. Run database seed (optional demo data):
echo        cd backend ^&^& npm run seed
echo   3. Start both services in development mode:
echo        npm run dev
echo ========================================================

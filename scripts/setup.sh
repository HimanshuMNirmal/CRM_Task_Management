#!/usr/bin/env bash
set -e

echo "========================================================"
echo " CRM Task Management - Linux/macOS Setup"
echo "========================================================"
echo ""

# 1. Check Node.js and npm
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not found. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm is not found. Please install npm."
    exit 1
fi

echo "[OK] Node.js version: $(node -v)"
echo "[OK] npm version: $(npm -v)"
echo ""

# 2. Setup Backend
echo "--------------------------------------------------------"
echo " [1/2] Configuring Backend"
echo "--------------------------------------------------------"
cd backend

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[INFO] Creating backend/.env from .env.example..."
        cp .env.example .env
        echo "[OK] backend/.env created."
    else
        echo "[WARN] backend/.env.example not found!"
    fi
else
    echo "[INFO] backend/.env already exists, skipping."
fi

mkdir -p uploads

echo "[INFO] Installing backend dependencies..."
npm install

echo "[INFO] Running backend typecheck..."
npm run typecheck || echo "[WARN] Backend typecheck encountered issues."

cd ..

# 3. Setup Frontend
echo ""
echo "--------------------------------------------------------"
echo " [2/2] Configuring Frontend"
echo "--------------------------------------------------------"
cd frontend

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[INFO] Creating frontend/.env from .env.example..."
        cp .env.example .env
        echo "[OK] frontend/.env created."
    else
        echo "[WARN] frontend/.env.example not found!"
    fi
else
    echo "[INFO] frontend/.env already exists, skipping."
fi

echo "[INFO] Installing frontend dependencies..."
npm install

echo "[INFO] Running frontend typecheck..."
npm run typecheck || echo "[WARN] Frontend typecheck encountered issues."

cd ..

echo ""
echo "========================================================"
echo " Setup Completed Successfully!"
echo "========================================================"
echo ""
echo "Next steps:"
echo "  1. Review backend/.env and set your MongoDB URI and JWT_SECRET"
echo "  2. Run database seed (optional demo data):"
echo "       cd backend && npm run seed"
echo "  3. Start both services in development mode:"
echo "       npm run dev"
echo "========================================================"


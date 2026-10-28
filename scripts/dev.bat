@echo off
echo ========================================================
echo  Starting Backend and Frontend in Development Mode...
echo ========================================================

start "Task Manager - Backend API (Port 5000)" cmd /k "cd backend && npm run dev"
start "Task Manager - Frontend Vite (Port 5173)" cmd /k "cd frontend && npm run dev"

echo Both services launched in separate windows.
echo   Backend API:  http://localhost:5000
echo   Frontend UI:  http://localhost:5173


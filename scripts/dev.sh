#!/usr/bin/env bash

echo "========================================================"
echo " Starting Backend and Frontend in Development Mode..."
echo "========================================================"

trap 'kill $(jobs -p)' EXIT

(cd backend && npm run dev) &
(cd frontend && npm run dev) &

echo "Both services launched:"
echo "  Backend API:  http://localhost:5000"
echo "  Frontend UI:  http://localhost:5173"
echo "Press Ctrl+C to terminate both servers."

wait


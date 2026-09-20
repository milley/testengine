#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Starting Test Engine API on :3000"
npx tsx src/api_server.ts &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
echo "Starting Vue UI on :5173"
npm run dev

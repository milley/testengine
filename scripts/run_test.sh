#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Compiling C++ core..."
cmake -S core -B core/build >/dev/null
cmake --build core/build -j4 >/dev/null
echo "Core OK"

echo "Compiling C++ stub..."
cmake -S stub -B stub/build >/dev/null
cmake --build stub/build -j4 >/dev/null
echo "Stub OK"

echo "Parsing sample tree..."
npx tsx src/main.ts parse --tree ./simple.json --expand >/dev/null
echo "Parse OK"

echo "Running tree (mock DLL via Node)..."
npx tsx src/main.ts run --tree ./simple.json
echo "Done. Logs in $ROOT/logs"

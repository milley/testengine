#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

API_PORT="${API_PORT:-3000}"
UI_PORT="${UI_PORT:-5173}"
TREE_FILE="${TREE_FILE:-demo.json}"
API_PID=""
UI_PID=""
THRIFT_PID=""
PIDS=()

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    return 0
  fi
  echo "Stopping old process on :$port ($pids)"
  kill $pids 2>/dev/null || true
  sleep 0.4
  pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
    sleep 0.2
  fi
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local n=0
  while [ "$n" -lt 40 ]; do
    if port_in_use "$port"; then
      return 0
    fi
    sleep 0.25
    n=$((n + 1))
  done
  echo "⚠️  $name did not listen on :$port"
  return 1
}

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  kill "$THRIFT_PID" "$API_PID" "$UI_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "🚀 Starting Test Engine..."
echo "============================="

echo "Stopping previous API / UI if any..."
stop_port "$API_PORT"
stop_port "$UI_PORT"
pkill -f "$ROOT/core/build/thrift_server" 2>/dev/null || true
pkill -f "$ROOT/src/api_server.ts" 2>/dev/null || true

echo "Cleaning build dirs..."
rm -rf core/build stub/build core/stub
mkdir -p "$ROOT/logs"

echo "Compiling C++ core..."
cmake -S core -B core/build
cmake --build core/build -j4
echo "✅ Core compiled"

echo "Compiling C++ stub..."
cmake -S stub -B stub/build
cmake --build stub/build -j4
echo "✅ Stub compiled"

echo "Starting Thrift server..."
"$ROOT/core/build/thrift_server" > "$ROOT/logs/thrift.log" 2>&1 &
THRIFT_PID=$!
PIDS+=("$THRIFT_PID")
sleep 1
if kill -0 "$THRIFT_PID" 2>/dev/null; then
  echo "✅ Thrift server running (PID: $THRIFT_PID)"
else
  echo "ℹ️  Thrift server exited (dummy mode). See logs/thrift.log"
fi

echo "Running test tree ($TREE_FILE)..."
set +e
npx tsx src/main.ts run --tree "./$TREE_FILE" | tee "$ROOT/logs/test.log"
TEST_EXIT=${PIPESTATUS[0]}
set -e

echo "============================="
if [ "$TEST_EXIT" -eq 0 ]; then
  echo "✅ Test completed successfully!"
else
  echo "❌ Test failed with exit code $TEST_EXIT"
fi

echo "Logs:"
echo "Thrift:   $ROOT/logs/thrift.log"
echo "Test:     $ROOT/logs/test.log"
echo "============================="

if [ "${SKIP_UI:-0}" = "1" ]; then
  exit "$TEST_EXIT"
fi

echo "Installing Node API deps if needed..."
if [ ! -d "$ROOT/node_modules/express" ] || [ ! -d "$ROOT/node_modules/cors" ]; then
  npm install
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Installing frontend deps..."
  (cd "$ROOT/frontend" && npm install)
fi

echo "Starting HTTP API on :$API_PORT ..."
TREE_FILE="$TREE_FILE" npx tsx src/api_server.ts > "$ROOT/logs/api.log" 2>&1 &
API_PID=$!
PIDS+=("$API_PID")
wait_for_port "$API_PORT" "API" || {
  echo "API log:"
  cat "$ROOT/logs/api.log" || true
  exit 1
}
echo "✅ API running (PID: $API_PID)  http://127.0.0.1:$API_PORT"

echo "Starting Vue frontend on :$UI_PORT ..."
(cd "$ROOT/frontend" && npm run dev -- --host 127.0.0.1 --port "$UI_PORT") > "$ROOT/logs/frontend.log" 2>&1 &
UI_PID=$!
PIDS+=("$UI_PID")
wait_for_port "$UI_PORT" "Frontend" || {
  echo "Frontend log:"
  cat "$ROOT/logs/frontend.log" || true
  exit 1
}
echo "✅ Frontend running (PID: $UI_PID)"

echo "============================="
echo "Open UI:  http://127.0.0.1:$UI_PORT"
echo "API:      http://127.0.0.1:$API_PORT"
echo "Config:   $TREE_FILE"
echo "Logs:     $ROOT/logs/{thrift,test,api,frontend}.log"
echo "Press Ctrl+C to stop API / frontend"
echo "============================="

wait "$UI_PID"

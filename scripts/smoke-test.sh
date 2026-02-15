#!/bin/bash
set -e

PORT=9876
TIMEOUT=15
URL="http://127.0.0.1:${PORT}/api/health"

# Check if port is already in use
if curl -sf "$URL" > /dev/null 2>&1; then
  echo "❌ Smoke test failed: port ${PORT} is already in use"
  exit 1
fi

echo "Building app..."
npm run build

echo "Launching Electron..."
npx electron out/main/index.js &
ELECTRON_PID=$!

cleanup() {
  echo "Stopping Electron (PID ${ELECTRON_PID})..."
  kill "$ELECTRON_PID" 2>/dev/null || true
  wait "$ELECTRON_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for debug server on ${URL} (timeout ${TIMEOUT}s)..."
for i in $(seq 1 "$TIMEOUT"); do
  if curl -sf "$URL" > /dev/null 2>&1; then
    echo "✅ Smoke test passed (server responded after ${i}s)"
    exit 0
  fi
  # Check if Electron process is still alive
  if ! kill -0 "$ELECTRON_PID" 2>/dev/null; then
    echo "❌ Smoke test failed: Electron process exited unexpectedly"
    exit 1
  fi
  sleep 1
done

echo "❌ Smoke test failed: debug server not responding after ${TIMEOUT}s"
exit 1

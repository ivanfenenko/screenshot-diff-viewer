#!/bin/bash

# Paparazzi Compare - Run Script
# Kills any existing instance and starts the app

APP_NAME="paparazzi-compare"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔍 Checking for running instances of $APP_NAME..."

# Find and kill any running instances
# Look for the Tauri dev process
PIDS=$(pgrep -f "tauri dev" || true)

if [ -n "$PIDS" ]; then
    echo "🛑 Found running instance(s). Killing processes: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "✅ Killed existing instances"
else
    echo "✅ No running instances found"
fi

# Also kill any node dev servers
NODE_PIDS=$(pgrep -f "vite.*1420" || true)
if [ -n "$NODE_PIDS" ]; then
    echo "🛑 Killing Vite dev server: $NODE_PIDS"
    echo "$NODE_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Change to project directory
cd "$PROJECT_DIR"

echo "🚀 Starting $APP_NAME..."
echo "📁 Working directory: $PROJECT_DIR"
echo ""

# Start the application
npm run tauri dev

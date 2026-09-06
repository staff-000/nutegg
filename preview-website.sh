#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NutEgg Website Local Preview Script
#
# Usage:
#   ./preview-website.sh        # Starts server on http://localhost:3000
#   ./preview-website.sh 8080   # Starts server on custom port
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${1:-3000}"

# Find an available port if the specified one is taken
while lsof -i :"$PORT" >/dev/null 2>&1; do
  echo "⚠️  Port $PORT is currently in use, trying $((PORT + 1))..."
  PORT=$((PORT + 1))
done

# 1. Build the website
echo "🌰/🥚 Preparing website build..."
node website/build.js
echo ""

# 2. Open browser in background after server starts
(sleep 0.8 && open "http://localhost:$PORT") 2>/dev/null &

echo "🚀 NutEgg Local Web Server Running!"
echo "   URL:      http://localhost:$PORT"
echo "   Docs:     http://localhost:$PORT/docs/index.html"
echo "   Serving:  $SCRIPT_DIR/website/dist"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo "------------------------------------------------------------"

# 3. Start Python 3 static HTTP server
exec python3 -m http.server "$PORT" --directory website/dist


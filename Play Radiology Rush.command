#!/bin/bash
# Double-click to play Radiology Rush. Serves the game locally so video, audio
# and saved progress all behave exactly like a real web build.
cd "$(dirname "$0")" || exit 1

PORT=4173
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done

echo ""
echo "  RADIOLOGY RUSH"
echo "  ──────────────────────────────────────────"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo "  On this Mac:      http://localhost:$PORT"
[ -n "$IP" ] && echo "  On your iPhone:   http://$IP:$PORT   (same Wi-Fi)"
echo "  Keep this window open while you play."
echo "  Close it (or press Ctrl-C) when you're done."
echo ""

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT INT TERM

sleep 1
open "http://localhost:$PORT/"
wait $SERVER

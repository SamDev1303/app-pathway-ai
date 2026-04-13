#!/bin/bash
# UniMate demo tunnel — hardened keep-alive wrapper (absolute paths, survives cwd issues)
# Usage: nohup ~/Desktop/Unimate-demo/mobile/tunnel-demo.sh > /dev/null 2>&1 &

MOBILE_DIR="/Users/shamalkrishna/Desktop/Unimate-demo/mobile"
LOG="$MOBILE_DIR/tunnel.log"
EXPO="$MOBILE_DIR/node_modules/.bin/expo"

cd "$MOBILE_DIR" || { echo "cannot cd $MOBILE_DIR" >> "$LOG"; exit 1; }
echo "=== tunnel-demo started $(date) (cwd=$(pwd)) ===" >> "$LOG"

while true; do
  echo "--- starting expo tunnel at $(date) ---" >> "$LOG"
  caffeinate -dimsu "$EXPO" start --tunnel >> "$LOG" 2>&1 < /dev/null
  echo "!!! tunnel exited at $(date), restarting in 5s !!!" >> "$LOG"
  sleep 5
done

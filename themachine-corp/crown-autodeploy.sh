#!/usr/bin/env bash
# crown-autodeploy.sh — background file watcher daemon
# Watches /crown/src/** and triggers deploy-crown.sh on change.
# Run as: nohup ./crown-autodeploy.sh &  (or with `npm run deploy:watch`)
# Logs to: ~/.config/crown-autodeploy.log

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCH_DIR="${SCRIPT_DIR}/../crown/src"
LOG_FILE="${HOME}/.config/crown-autodeploy.log"
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy-crown.sh"
DEBOUNCE_SEC=2

mkdir -p "$(dirname "$LOG_FILE")"

if ! command -v inotifywait >/dev/null; then
  echo "[$(date -Iseconds)] ❌ inotifywait not installed. sudo apt install inotify-tools" | tee -a "$LOG_FILE"
  exit 1
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🚀 crown-autodeploy started. Watching $WATCH_DIR"
log "   Debounce: ${DEBOUNCE_SEC}s"
log "   Deploy script: $DEPLOY_SCRIPT"

# Inotify loop with debounce (avoid rapid-fire deploys on save)
LAST_TRIGGER=0
inotifywait -m -r -e modify,create,delete,move "$WATCH_DIR" --format '%w%f %e' |
while read path event; do
  NOW=$(date +%s)
  if [ $((NOW - LAST_TRIGGER)) -lt $DEBOUNCE_SEC ]; then
    continue
  fi
  LAST_TRIGGER=$NOW

  # Skip non-source files
  case "$path" in
    *.swp|*.swo|*.tmp|*~) continue ;;
  esac

  log "📝 $event: ${path#$WATCH_DIR/}"
  log "   → triggering deploy..."

  if "$DEPLOY_SCRIPT" --skip-build >> "$LOG_FILE" 2>&1; then
    DEPLOY_URL=$(grep -oE 'https://[a-f0-9]+\.themachine-corp\.pages\.dev' "$LOG_FILE" | tail -1)
    log "   ✅ deploy OK → ${DEPLOY_URL:-https://themachine-corp.pages.dev/crown/}"
  else
    log "   ❌ deploy FAILED. See log."
  fi
done

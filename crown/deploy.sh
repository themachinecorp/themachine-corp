#!/usr/bin/env bash
# deploy: trigger full insurance deploy (build + backup + sync + deploy)
# Quick: build + deploy only, skip backup if user confirms (--force)
# Watch: watch files and auto-deploy on change

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DEPLOY="${SCRIPT_DIR}/../themachine-corp/deploy-crown.sh"

case "${1:-}" in
  watch)
    echo "👀 Watching $SCRIPT_DIR/src for changes..."
    echo "   Auto-deploy on save. Ctrl+C to stop."
    if ! command -v inotifywait >/dev/null; then
      echo "⚠️  inotifywait not installed. Install: sudo apt install inotify-tools"
      exit 1
    fi
    inotifywait -m -r -e modify,create,delete "$SCRIPT_DIR/src" --format '%w%f %e' |
    while read path event; do
      echo "[$(date +%H:%M:%S)] $event $path"
      echo "   → deploying..."
      "$ROOT_DEPLOY" --skip-build 2>&1 | tail -3
    done
    ;;
  force)
    # Skip rebuild, deploy existing build
    echo "🚀 Force deploy (skip rebuild, no fresh backup)"
    "$ROOT_DEPLOY" --skip-build
    ;;
  ""|deploy)
    echo "🚀 Full insurance deploy: build + backup + sync + deploy"
    "$ROOT_DEPLOY"
    ;;
  *)
    echo "Usage: $0 [deploy|watch|force]"
    echo "  deploy (default): full insurance deploy"
    echo "  watch:           auto-deploy on file change"
    echo "  force:           skip rebuild, deploy existing build"
    exit 1
    ;;
esac

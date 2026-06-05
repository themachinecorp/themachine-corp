#!/usr/bin/env bash
# ─── deploy-crown.sh ───────────────────────────────────────────────
# Build & deploy Crown to themachine-corp Pages project.
# Auto-backs up existing themecorpcorp/out, syncs latest crown/out/crown
# into themecorpcorp/out/crown, then deploys the full themecorpcorp out.
#
# Usage:
#   ./deploy-crown.sh              # full build + deploy
#   ./deploy-crown.sh --skip-build # skip crown build (use existing out)
#   ./deploy-crown.sh --no-deploy  # build + sync only, no deploy
#
# Why: Cloudflare Pages project is a flat namespace. Deploying crown/out
# alone would overwrite themecorpcorp main site. This script guarantees
# themecorpcorp main pages + crown are deployed together.
# ───────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Resolve paths ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CROWN_DIR="${SCRIPT_DIR}/../crown"
TARGET_OUT="${SCRIPT_DIR}/out"
BACKUP_ROOT="${SCRIPT_DIR}/.out-backups"
ACCOUNT_ID="ae030de578dfa0a3e796a53380d03208"
PROJECT_NAME="themachine-corp"

# ─── Parse args ───
SKIP_BUILD=false
NO_DEPLOY=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --no-deploy)  NO_DEPLOY=true ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \?//'
      exit 0
      ;;
  esac
done

# ─── Preflight checks ───
[ -d "$CROWN_DIR" ] || { echo "❌ Crown dir not found: $CROWN_DIR"; exit 1; }
[ -d "$TARGET_OUT" ] || { echo "❌ themecorpcorp/out not found: $TARGET_OUT"; exit 1; }

# Load .env for CLOUDFLARE_API_TOKEN (check themecorpcorp first, then crown)
for env_file in "${SCRIPT_DIR}/.env" "${CROWN_DIR}/.env" "${SCRIPT_DIR}/.env.local" "${CROWN_DIR}/.env.local"; do
  if [ -f "$env_file" ] && [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    set -a; source "$env_file"; set +a
    [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && echo "    ✓ Loaded CLOUDFLARE_API_TOKEN from $env_file"
  fi
done
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set. Add to ${SCRIPT_DIR}/.env or ${CROWN_DIR}/.env"
  exit 1
fi

# ─── 1. Build Crown ───
if [ "$SKIP_BUILD" = false ]; then
  echo "🔨 [1/4] Building crown..."
  (cd "$CROWN_DIR" && npm run build)
else
  echo "⏭️  [1/4] Skipping crown build"
fi

# Verify crown build output. Next.js exports to out/ root.
# If out/index.html missing but out/crown/index.html exists (post-deploy state), reverse-restructure.
if [ ! -f "$CROWN_DIR/out/index.html" ] && [ -f "$CROWN_DIR/out/crown/index.html" ]; then
  echo "    🔄 Restoring out/crown/* → out/* (reverse from previous deploy)"
  shopt -s dotglob nullglob
  for f in "$CROWN_DIR/out/crown"/*; do
    base=$(basename "$f")
    mv "$f" "$CROWN_DIR/out/$base"
  done
  shopt -u dotglob nullglob
  rmdir "$CROWN_DIR/out/crown" 2>/dev/null || true
fi
[ -f "$CROWN_DIR/out/index.html" ] || { echo "❌ crown/out/index.html missing after build"; exit 1; }

# Inject <link rel="modulepreload"> for top 4 JS chunks (perf optimization)
if [ -f "$CROWN_DIR/scripts/inject-preloads.js" ]; then
  echo "    ⚡ Injecting modulepreload links..."
  (cd "$CROWN_DIR" && node scripts/inject-preloads.js) || echo "    ⚠️  preload injection failed, continuing"
fi

# Inline critical CSS into HTML (eliminate render-blocking CSS request)
if [ -f "$CROWN_DIR/scripts/inline-critical-css.js" ]; then
  echo "    🎨 Inlining critical CSS..."
  (cd "$CROWN_DIR" && node scripts/inline-critical-css.js) || echo "    ⚠️  CSS inline failed, continuing"
fi
# Move out/* → out/crown/* (so when copied to themecorpcorp/out/crown, files are under /crown/ path)
if [ ! -d "$CROWN_DIR/out/crown" ]; then
  echo "    📁 Restructuring out/* → out/crown/*"
  mkdir -p "$CROWN_DIR/out/crown"
  shopt -s dotglob nullglob
  for f in "$CROWN_DIR/out"/*; do
    base=$(basename "$f")
    if [ "$base" != "crown" ]; then
      mv "$f" "$CROWN_DIR/out/crown/$base"
    fi
  done
  shopt -u dotglob nullglob
fi
echo "    ✓ crown build OK ($(du -sh "$CROWN_DIR/out/crown" | cut -f1))"

# ─── 2. Backup existing themecorpcorp/out ───
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/out.${TIMESTAMP}"
mkdir -p "$BACKUP_ROOT"
echo "💾 [2/4] Backing up themecorpcorp/out → ${BACKUP_DIR}"
cp -r "$TARGET_OUT" "$BACKUP_DIR"
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "    ✓ backup complete (${BACKUP_SIZE})"

# Auto-prune: keep only the 5 most recent backups
BACKUP_COUNT=$(ls -1dt "$BACKUP_ROOT"/out.* 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 5 ]; then
  echo "    🧹 Pruning old backups (keeping latest 5)..."
  ls -1dt "$BACKUP_ROOT"/out.* | tail -n +6 | xargs -r rm -rf
fi

# ─── 3. Sync latest crown build into themecorpcorp/out/crown ───
echo "🔄 [3/4] Syncing crown/out/crown → themecorpcorp/out/crown"
rm -rf "$TARGET_OUT/crown"
cp -r "$CROWN_DIR/out/crown" "$TARGET_OUT/crown"
echo "    ✓ crown synced ($(du -sh "$TARGET_OUT/crown" | cut -f1))"

# Verify main index.html is intact
[ -f "$TARGET_OUT/index.html" ] || { echo "❌ themecorpcorp/out/index.html missing!"; exit 1; }
MAIN_TITLE=$(grep -oE '<title>[^<]+</title>' "$TARGET_OUT/index.html" | head -1)
echo "    ✓ Main index: $MAIN_TITLE"

# Copy any standalone pages from public/ (e.g. waitlist.html)
if [ -d "${SCRIPT_DIR}/public" ]; then
  PUBLIC_FILES=$(find "${SCRIPT_DIR}/public" -maxdepth 1 -type f 2>/dev/null | wc -l)
  if [ "$PUBLIC_FILES" -gt 0 ]; then
    echo "📋 [3.5/4] Copying $PUBLIC_FILES standalone pages from public/"
    cp -f "${SCRIPT_DIR}/public/"*.html "$TARGET_OUT/" 2>/dev/null || true
  fi
fi

# Verify crown content is fresh
[ -f "$TARGET_OUT/crown/index.html" ] || { echo "❌ crown/index.html missing after sync"; exit 1; }
CROWN_HAS_PUNCH=$(grep -c "hero-punch\|hero-trust-block" "$TARGET_OUT/crown/index.html" || true)
[ "$CROWN_HAS_PUNCH" -gt 0 ] || { echo "❌ crown/index.html missing v3.1+ markers"; exit 1; }
echo "    ✓ Crown has v3.1+ hero-punch marker"

# ─── 4. Deploy ───
if [ "$NO_DEPLOY" = true ]; then
  echo "⏭️  [4/4] Skipping deploy (--no-deploy)"
  echo ""
  echo "✅ Build + sync complete. Review themecorpcorp/out and run deploy manually:"
  echo "   cd $SCRIPT_DIR && CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID wrangler pages deploy out --project-name $PROJECT_NAME --branch main --commit-dirty=true"
  exit 0
fi

echo "🚀 [4/4] Deploying themecorpcorp/out to Cloudflare Pages..."
cd "$SCRIPT_DIR"
CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" \
  wrangler pages deploy out \
    --project-name "$PROJECT_NAME" \
    --branch main \
    --commit-dirty=true

echo ""
echo "✅ Deploy complete!"
echo "   Main:   https://$PROJECT_NAME.pages.dev/"
echo "   Crown:  https://$PROJECT_NAME.pages.dev/crown/"
echo "   Backup: $BACKUP_DIR"

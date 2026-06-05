#!/bin/bash
# ───────────────────────────────────────────────────────────
# Network Watch — 检测 wrangler deploy 网络 + 触发 retry
# 每 5 分钟 cron 跑一次，发现问题自动重试
# ───────────────────────────────────────────────────────────
set -e

ACCOUNT_ID="ae030de578dfa0a3e796a53380d03208"
PROJECT="themachine-corp"
STATE_DIR="$HOME/.openclaw/network-watch"
mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/watch.log"
TS=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$TS] $*" | tee -a "$LOG"; }

# 1. 健康检查：能否访问 api.cloudflare.com
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 \
  "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer ${CF_API_TOKEN:-REPLACE_VIA_ENV}" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
  log "⚠️  api.cloudflare.com 不通 (HTTP $HTTP_CODE) — 跳过 deploy 尝试"
  echo "$HTTP_CODE" > "$STATE_DIR/last-status"
  exit 0
fi

log "✅ api.cloudflare.com 通"

# 2. 检查 production 网站是否还能访问
SITE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://themachine-corp.pages.dev/" 2>/dev/null || echo "000")
log "   themachine-corp.pages.dev/ HTTP $SITE_CODE"

# 3. 检查关键 URL（logomind/about/team/waitlist）
for path in /logomind /about /team /waitlist; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "https://themachine-corp.pages.dev$path" 2>/dev/null || echo "000")
  log "   $path HTTP $CODE"
  if [ "$CODE" != "200" ]; then
    log "   ❌ $path 异常, 标记需要重 deploy"
    touch "$STATE_DIR/need-redeploy"
  fi
done

# 4. 如果发现需要重 deploy 且最近 30 分钟没跑过，则触发
NEED=$(test -f "$STATE_DIR/need-redeploy" && echo "yes" || echo "no")
LAST=$(stat -c %Y "$STATE_DIR/last-redeploy" 2>/dev/null || echo 0)
NOW=$(date +%s)
COOLDOWN=1800  # 30 min cooldown

if [ "$NEED" = "yes" ] && [ $((NOW - LAST)) -gt $COOLDOWN ]; then
  log "🔄 触发 wrangler deploy (cooldown $((COOLDOWN/60)) min)"
  cd /home/themachine/.openclaw/workspace/themachine-corp || exit 1
  for i in 1 2 3; do
    log "   deploy retry $i"
    if timeout 90 npx wrangler pages deploy out \
        --project-name="$PROJECT" --branch main --commit-dirty=true 2>&1 \
        | tee -a "$LOG" | grep -q "Deployment complete"; then
      log "   ✅ deploy 成功"
      rm -f "$STATE_DIR/need-redeploy"
      date +%s > "$STATE_DIR/last-redeploy"
      break
    fi
    sleep 6
  done
fi

# 5. 清理 7 天前的日志
find "$STATE_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
log "--- watch tick done ---"

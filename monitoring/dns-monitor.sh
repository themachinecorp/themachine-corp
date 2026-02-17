#!/bin/bash
# DNS / 域名监控脚本

LOG_FILE="$HOME/.openclaw/workspace/monitoring/dns.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 要检查的域名
DOMAINS=(
    "mystic-ai-henna.vercel.app"
    "crime-ai.vercel.app"
    "themachine-dashboard.vercel.app"
)

echo "========== DNS 监控 $(date) =========="

for domain in "${DOMAINS[@]}"; do
    # 检查 DNS 解析
    if result=$(dig +short "$domain" 2>/dev/null | head -1); then
        if [ -n "$result" ]; then
            echo "✅ $domain -> $result"
        else
            echo "❌ $domain: 解析失败"
            log "ERROR: $domain DNS resolution failed"
        fi
    else
        # dig 不可用，尝试 nslookup
        if result=$(nslookup "$domain" 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}'); then
            if [ -n "$result" ]; then
                echo "✅ $domain -> $result"
            else
                echo "❌ $domain: 解析失败"
                log "ERROR: $domain DNS resolution failed"
            fi
        else
            echo "❌ $domain: 无法检查"
            log "ERROR: $domain DNS check failed"
        fi
    fi
done

echo "========== 监控完成 =========="

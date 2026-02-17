#!/bin/bash
# SSL 证书监控脚本

LOG_FILE="$HOME/.openclaw/workspace/monitoring/ssl.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 要检查的网站
SITES=(
    "mystic-ai-henna.vercel.app:443"
    "crime-ai.vercel.app:443"
    "themachine-dashboard.vercel.app:443"
)

echo "========== SSL 证书监控 $(date) =========="

for site in "${SITES[@]}"; do
    domain="${site%:443}"
    port="${site##*:}"
    
    # 获取证书信息
    cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null)
    
    if [ -z "$cert_info" ]; then
        echo "❌ $domain: 无法获取证书"
        log "ERROR: $domain certificate fetch failed"
        continue
    fi
    
    # 提取过期日期
    not_after=$(echo "$cert_info" | grep "notAfter=" | head -1)
    expiry_date=$(echo "$not_after" | cut -d= -f2)
    
    # 转换为时间戳
    expiry_ts=$(date -d "$expiry_date" +%s 2>/dev/null)
    now_ts=$(date +%s)
    
    # 计算剩余天数
    days_left=$(( (expiry_ts - now_ts) / 86400 ))
    
    # 提取域名
    domain_name=$(echo "$cert_info" | grep "subject=" | cut -d= -f2)
    
    if [ "$days_left" -lt 0 ]; then
        echo "❌ $domain: 证书已过期！"
        log "ALERT: $domain certificate EXPIRED"
    elif [ "$days_left" -lt 14 ]; then
        echo "⚠️ $domain: 证书即将过期（${days_left}天）"
        log "WARNING: $domain expires in $days_left days"
    else
        echo "✅ $domain: 证书正常（${days_left}天）"
    fi
done

echo "========== 监控完成 =========="

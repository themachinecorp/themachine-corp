#!/bin/bash
# 代理/Clash 监控脚本

LOG_FILE="$HOME/.openclaw/workspace/monitoring/proxy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

echo "========== 代理监控 $(date) =========="

# 检查 Clash 进程
if pgrep -f "clash" > /dev/null 2>&1; then
    echo "✅ Clash 进程运行中"
    
    # 尝试获取 Clash API 状态
    if curl -s --max-time 5 http://127.0.0.1:9090/configs > /dev/null 2>&1; then
        echo "✅ Clash API 可访问 (localhost:9090)"
        
        # 获取当前代理
        if current=$(curl -s http://127.0.0.1:9090/proxies 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('now','N/A'))" 2>/dev/null); then
            echo "🌐 当前代理: $current"
        fi
        
        # 获取流量统计
        if traffic=$(curl -s http://127.0.0.1:9090/traffic 2>/dev/null); then
            echo "📊 API 响应正常"
        fi
    else
        echo "⚠️ Clash API 不可访问（可能配置不同端口）"
    fi
else
    echo "❌ Clash 未运行"
    log "ERROR: Clash not running"
fi

# 检查代理端口
for port in 7890 7891 6789 1080; do
    if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
        echo "✅ 端口 $port 正在监听"
    fi
done

# 检查代理是否可达
test_urls=(
    "https://www.google.com"
    "https://api.openai.com"
    "https://api.github.com"
)

echo "🌍 出口IP检测:"
for url in "${test_urls[@]}"; do
    if curl -s --max-time 10 -x socks5h://127.0.0.1:7890 "$url" > /dev/null 2>&1; then
        echo "  ✅ $url (SOCKS5)"
        break
    elif curl -s --max-time 10 -x http://127.0.0.1:7890 "$url" > /dev/null 2>&1; then
        echo "  ✅ $url (HTTP)"
        break
    fi
done

echo "========== 监控完成 =========="

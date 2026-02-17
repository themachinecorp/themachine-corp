#!/bin/bash
# 服务监控脚本 - 检查关键服务状态

LOG_FILE="$HOME/.openclaw/workspace/monitoring/service.log"
ALERT_FILE="$HOME/.openclaw/workspace/monitoring/alerts.json"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 检查服务是否运行
check_service() {
    local name="$1"
    local cmd="$2"
    
    if pgrep -f "$cmd" > /dev/null 2>&1; then
        echo "✅ $name 运行中"
        return 0
    else
        echo "❌ $name 已停止"
        return 1
    fi
}

# 尝试重启服务
restart_service() {
    local name="$1"
    local restart_cmd="$2"
    
    log "尝试重启 $name..."
    eval "$restart_cmd" >> "$LOG_FILE" 2>&1
    sleep 3
    
    if pgrep -f "$cmd" > /dev/null 2>&1; then
        log "✅ $name 重启成功"
        echo "✅ $name 已重启"
    else
        log "❌ $name 重启失败"
        echo "⚠️ $name 重启失败，需要手动检查"
    fi
}

echo "========== 服务监控 $(date) =========="

# 1. OKX 网格机器人
if systemctl is-active --quiet okx-grid-bot; then
    echo "✅ OKX Grid Bot 运行中"
else
    echo "❌ OKX Grid Bot 已停止，尝试重启..."
    sudo systemctl restart okx-grid-bot
    sleep 2
    if systemctl is-active --quiet okx-grid-bot; then
        echo "✅ OKX Grid Bot 已重启"
    else
        echo "⚠️ OKX Grid Bot 重启失败"
    fi
fi

# 2. OpenClaw Gateway
if pgrep -f "openclaw" > /dev/null 2>&1; then
    echo "✅ OpenClaw 运行中"
else
    echo "⚠️ OpenClaw 未运行"
fi

# 3. Clash 代理
if pgrep -f "clash" > /dev/null 2>&1; then
    echo "✅ Clash 代理运行中"
else
    echo "❌ Clash 代理未运行"
fi

# 4. Vercel CLI 守护进程
if pgrep -f "vercel" > /dev/null 2>&1; then
    echo "✅ Vercel CLI 运行中"
fi

echo "========== 监控完成 =========="

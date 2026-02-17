#!/bin/bash
# Cron 任务管理脚本

MONITOR_DIR="$HOME/.openclaw/workspace/monitoring"
CRON_LIST_FILE="$MONITOR_DIR/crons.txt"

echo "========== Cron 任务管理 $(date) =========="

echo ""
echo "📋 OpenClaw 定时任务:"
echo "---"

# 列出 OpenClaw cron 任务
cd "$HOME/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw" 2>/dev/null
if openclaw cron list 2>/dev/null | head -20; then
    :
else
    echo "（无法获取 OpenClaw cron 列表）"
fi

echo ""
echo "📋 系统 Cron:"
echo "---"
sudo crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | head -20

echo ""
echo "📋 监控脚本状态:"
echo "---"
scripts=(
    "service-monitor.sh"
    "ssl-monitor.sh"
    "dns-monitor.sh"
    "backup-monitor.sh"
    "proxy-monitor.sh"
)

for script in "${scripts[@]}"; do
    path="$MONITOR_DIR/$script"
    if [ -f "$path" ]; then
        perms=$(stat -c %a "$path" 2>/dev/null)
        size=$(stat -c %s "$path" 2>/dev/null)
        echo "  ✅ $script (权限:$perms, ${size}字节)"
    else
        echo "  ❌ $script (不存在)"
    fi
done

echo ""
echo "========== 完成 =========="

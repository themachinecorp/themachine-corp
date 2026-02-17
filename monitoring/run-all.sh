#!/bin/bash
# 综合监控脚本 - 运行所有检查

MONITOR_DIR="$HOME/.openclaw/workspace/monitoring"
REPORT_FILE="$MONITOR_DIR/report.md"

echo "生成综合监控报告..."

{
    echo "# 监控报告 - $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "## 系统状态"
    echo ""
    echo "### 服务状态"
    bash "$MONITOR_DIR/service-monitor.sh" 2>&1 | grep -E "✅|❌|⚠️"
    echo ""
    echo "### 代理状态"
    bash "$MONITOR_DIR/proxy-monitor.sh" 2>&1 | grep -E "✅|❌|⚠️"
    echo ""
    echo "### SSL 证书"
    bash "$MONITOR_DIR/ssl-monitor.sh" 2>&1 | grep -E "✅|❌|⚠️"
    echo ""
    echo "### DNS 解析"
    bash "$MONITOR_DIR/dns-monitor.sh" 2>&1 | grep -E "✅|❌|⚠️"
    echo ""
    echo "### 备份状态"
    bash "$MONITOR_DIR/backup-monitor.sh" 2>&1 | grep -E "✅|❌|⚠️|📁|📝"
    echo ""
} > "$REPORT_FILE"

cat "$REPORT_FILE"

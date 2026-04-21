#!/bin/bash
# Kevin 网络监控脚本 - 每5分钟检查网络和Gateway状态
# 断网自动修复，记录日志

LOG_FILE="/home/themachine/.openclaw/workspace/memory/2026-03-31.md"
LOCK_FILE="/tmp/kevin_network_watch.lock"
LAST_DOWN_FILE="/tmp/kevin_last_down_state"

log_msg() {
    echo "$(date '+%Y-%m-%d %H:%M') - $1" >> "$LOG_FILE"
}

notify_founder() {
    # 通知消息通过主agent完成，此处只记录
    log_msg "FOUNDER_ALERT: $1"
}

# 单次检查
do_check() {
    # Ping检测 - 连续2次丢包100%才算断网
    RESULT=$(ping -c 3 8.8.8.8 2>&1)
    RECEIVED=$(echo "$RESULT" | grep "received" | awk '{print $4}')
    LOSS=$(echo "$RESULT" | grep "packet loss" | awk '{print $6}' | tr -d '%')

    if [[ -z "$RECEIVED" ]] || [[ "$LOSS" == "100" ]]; then
        echo "DOWN"
    else
        echo "UP"
    fi
}

# 主循环
log_msg "=== Kevin 网络监控启动 ==="

while true; do
    CHECK1=$(do_check)
    sleep 5
    CHECK2=$(do_check)

    # 两次检查都DOWN才算断网
    if [[ "$CHECK1" == "DOWN" ]] && [[ "$CHECK2" == "DOWN" ]]; then
        CURRENT_STATE=$(cat "$LAST_DOWN_FILE" 2>/dev/null)
        if [[ "$CURRENT_STATE" != "DOWN" ]]; then
            log_msg "🚨 网络断网！执行Gateway重启..."
            echo "DOWN" > "$LAST_DOWN_FILE"

            # 尝试重启gateway
            openclaw gateway restart 2>&1 | head -5 >> "$LOG_FILE"
            sleep 5

            # 检查重启是否成功
            PROBE=$(openclaw gateway status 2>&1 | grep "RPC probe" | awk '{print $3}')
            if [[ "$PROBE" == "ok" ]]; then
                log_msg "✅ Gateway重启成功，网络修复完成"
                echo "RECOVERED" > "$LAST_DOWN_FILE"
            else
                log_msg "❌ Gateway重启失败，尝试start..."
                openclaw gateway start 2>&1 | head -5 >> "$LOG_FILE"
                sleep 5
                PROBE2=$(openclaw gateway status 2>&1 | grep "RPC probe" | awk '{print $3}')
                if [[ "$PROBE2" == "ok" ]]; then
                    log_msg "✅ Gateway start成功，网络修复完成"
                    echo "RECOVERED" > "$LAST_DOWN_FILE"
                else
                    log_msg "❌ Gateway修复失败，需要人工干预！"
                    echo "DOWN" > "$LAST_DOWN_FILE"
                fi
            fi
        fi
    else
        # 网络正常
        CURRENT_STATE=$(cat "$LAST_DOWN_FILE" 2>/dev/null)
        if [[ "$CURRENT_STATE" == "DOWN" ]]; then
            # 之前是DOWN状态，现在恢复了
            log_msg "✅ 网络自动恢复，确认Gateway正常"
            echo "UP" > "$LAST_DOWN_FILE"
        fi
        # 正常状态不报告
    fi

    # Gateway状态检查（独立于网络）
    GW_PROBE=$(openclaw gateway status 2>&1 | grep "RPC probe" | awk '{print $3}')
    if [[ "$GW_PROBE" != "ok" ]]; then
        log_msg "⚠️ Gateway RPC异常，尝试重启..."
        openclaw gateway restart 2>&1 | head -5 >> "$LOG_FILE"
    fi

    sleep 295  # 再等5分钟(减去之前的检查时间约5秒)
done

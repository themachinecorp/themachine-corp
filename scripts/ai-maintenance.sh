#!/bin/bash
# AI Generator 自动维护脚本
# 每5分钟检查服务状态，自动重启

LOG="/tmp/ai-maintenance.log"

echo "$(date) - 检查服务状态" >> $LOG

# 检查 ComfyUI
if ! curl -s http://localhost:8188 > /dev/null 2>&1; then
    echo "$(date) - ComfyUI 未运行，启动中..." >> $LOG
    cd ~/video-ai/ComfyUI
    source venv/bin/activate
    nohup python main.py --listen 0.0.0.0 --port 8188 > /tmp/comfy.log 2>&1 &
    sleep 10
fi

# 检查 Proxy
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "$(date) - Proxy 未运行，启动中..." >> $LOG
    cd ~/.openclaw/workspace/ai-generator
    nohup python3 proxy.py > /tmp/proxy.log 2>&1 &
    sleep 3
fi

# 检查 Cloudflared
if ! pgrep -f "cloudflared.*8080" > /dev/null; then
    echo "$(date) - Cloudflared 未运行，启动隧道..." >> $LOG
    nohup /tmp/cloudflared tunnel --url http://localhost:8080 > /tmp/cf.log 2>&1 &
    sleep 15
    URL=$(grep "https://" /tmp/cf.log | head -1 | awk '{print $NF}')
    if [ -n "$URL" ]; then
        echo "$(date) - 新URL: $URL" >> $LOG
    fi
fi

echo "$(date) - 检查完成" >> $LOG

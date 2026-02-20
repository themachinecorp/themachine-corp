#!/bin/bash
# ComfyUI Watchdog - Auto-restart if crashed

LOG_FILE="/tmp/comfy_watchdog.log"
COMFY_PORT=8188
CHECK_URL="http://localhost:${COMFY_PORT}/system_stats"
RESTART_CMD="cd ~/video-ai/ComfyUI && source venv/bin/activate && nohup python main.py --listen 0.0.0.0 --port ${COMFY_PORT} --lowvram > /tmp/comfy.log 2>&1 &"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_comfy() {
    curl -sf --max-time 5 "$CHECK_URL" > /dev/null 2>&1
    return $?
}

restart_comfy() {
    log "ComfyUI down, restarting..."
    pkill -f "python main.py.*8188" 2>/dev/null
    sleep 2
    eval $RESTART_CMD
    sleep 5
    
    if check_comfy; then
        log "ComfyUI restarted successfully"
    else
        log "Failed to restart ComfyUI"
    fi
}

log "ComfyUI watchdog started"

while true; do
    if ! check_comfy; then
        log "ComfyUI not responding, checking process..."
        if ! pgrep -f "python main.py.*8188" > /dev/null; then
            restart_comfy
        else
            log "Process exists but not responding, restarting..."
            restart_comfy
        fi
    fi
    sleep 30
done

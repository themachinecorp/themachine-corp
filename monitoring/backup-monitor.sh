#!/bin/bash
# 备份状态监控脚本

LOG_FILE="$HOME/.openclaw/workspace/monitoring/backup.log"
LAST_BACKUP_FILE="$HOME/.openclaw/workspace/monitoring/.last_backup"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

echo "========== 备份监控 $(date) =========="

# 检查上次备份时间
if [ -f "$LAST_BACKUP_FILE" ]; then
    last_backup=$(cat "$LAST_BACKUP_FILE")
    last_ts=$(stat -c %Y "$LAST_BACKUP_FILE" 2>/dev/null)
    now_ts=$(date +%s)
    diff_hours=$(( (now_ts - last_ts) / 3600 ))
    
    echo "📅 上次备份: $last_backup (${diff_hours}小时前)"
    
    if [ "$diff_hours" -gt 28 ]; then
        echo "⚠️ 超过24小时未备份！"
        log "WARNING: No backup in $diff_hours hours"
    fi
else
    echo "⚠️ 从未备份过"
    log "ERROR: No backup recorded"
fi

# 检查 Git 状态
cd "$HOME/.openclaw/workspace" 2>/dev/null

if git rev-parse --git-dir > /dev/null 2>&1; then
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        uncommitted=$(git status --porcelain | wc -l)
        echo "📝 有 $uncommitted 个未提交的更改"
    else
        echo "✅ 工作区干净"
    fi
    
    # 检查与远程的差距
    if git rev-parse --verify origin/master > /dev/null 2>&1; then
        behind=$(git rev-list --count HEAD..origin/master 2>/dev/null || echo "0")
        ahead=$(git rev-list --count origin/master..HEAD 2>/dev/null || echo "0")
        
        if [ "$behind" -gt 0 ]; then
            echo "⚠️ 落后远程 $behind 个提交"
        fi
        if [ "$ahead" -gt 0 ]; then
            echo "📤 领先远程 $ahead 个提交"
        fi
        if [ "$behind" -eq 0 ] && [ "$ahead" -eq 0 ]; then
            echo "✅ 与远程同步"
        fi
    fi
else
    echo "❌ 非 Git 仓库"
fi

# 检查备份目录
backup_dirs=("$HOME/.openclaw/workspace_backup" "$HOME/.openclaw/workspace/memory")
for dir in "${backup_dirs[@]}"; do
    if [ -d "$dir" ]; then
        files=$(find "$dir" -type f 2>/dev/null | wc -l)
        size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo "📁 $dir: $files 文件, $size"
    fi
done

echo "========== 监控完成 =========="

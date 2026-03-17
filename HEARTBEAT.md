# HEARTBEAT.md - Self-healing monitor

## Heartbeat Monitor
Every 2 minutes, verify:
1. Cron jobs status
2. Gateway health
3. Reset if stuck

## Cron Health Check
Check if daily cron jobs have stale lastRun (>26 hours). If stale, trigger re-run:
```bash
openclaw cron run <jobId> --force
```

## Jobs to Monitor
- cto-research (8:01 AM): 每天AI研究
- cmo-content (9:01 AM, 1:01 PM): 内容创作
- cto-code (10:01 AM): 代码审查
- cfo-analysis (daily): 交易分析

## Auto-recovery
If gateway down: openclaw gateway restart
If agent stuck: sessions_yield and restart

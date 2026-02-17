# 项目状态

## 活跃项目

### 1. OKX 网格交易
- 状态：运行中（systemd）
- 交易对：BTC, ETH, SOL, DOGE, XRP
- 收益：-0.01 USDT
- 位置：~/.openclaw/workspace/okx-grid-bot/

### 2. Mystic AI
- 状态：已部署
- URL：https://mystic-ai-henna.vercel.app
- API：MiniMax

### 3. Crime AI (THE MACHINE)
- 状态：已部署（优化中）
- URL：https://crime-ai.vercel.app

### 4. Dashboard
- 状态：运行中
- URL：https://themachine-dashboard.vercel.app

## 监控系统 (新增)

位置：~/.openclaw/workspace/monitoring/

| 脚本 | 功能 | 状态 |
|------|------|------|
| service-monitor.sh | 服务监控（OKX、OpenClaw、Clash） | ✅ |
| ssl-monitor.sh | SSL 证书监控 | ✅ |
| dns-monitor.sh | DNS 解析监控 | ✅ |
| backup-monitor.sh | 备份状态监控 | ✅ |
| proxy-monitor.sh | Clash 代理监控 | ✅ |
| run-all.sh | 综合报告 | ✅ |
| cron-manager.sh | Cron 任务管理 | ✅ |

### Cron 任务
- System Monitor：每 2 小时运行
- OKX Bot Status：每 2 小时
- Dashboard Auto-Optimize：每 2 小时
- Crime AI Auto-Optimize：每小时
- Workspace Backup：每小时
- Multi-Project Status：每 2 小时

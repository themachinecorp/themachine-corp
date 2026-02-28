# THEMACHINE Corp. Agent 自我进化方案

## 状态: 🔄 进行中

---

## 已完成

### ✅ P1: Agent 每日复盘

**实现:**
- Skill: `skills/agent-review/`
- 脚本: `scripts/daily-review.sh`
- Cron: 每天 22:00 自动运行
- 输出: `~/.openclaw/workspace/agents/<agent>/DAILY_REVIEW.md`

**功能:**
- 分析各 Agent 的 session 数量
- 统计 Token 消耗
- 生成改进建议

### ✅ P2: CEO 团队优化

**实现:**
- 脚本: `scripts/team-optimization.sh`
- Cron: 每天凌晨 2:00 自动运行
- 输出: `~/.openclaw/workspace/REPORTS/team-optimization-YYYYMMDD.md`

**功能:**
- 扫描所有 Agent 表现
- 生成团队优化报告

---

## 待实现

### P3: 集成 Capability Evolver

- 为每个 Agent 配置独立 evolver
- 扫描各自的历史记录
- 生成个性化优化

---

## 使用方法

### 手动运行复盘
```bash
~/.openclaw/workspace/scripts/daily-review.sh
```

### 手动运行团队优化
```bash
~/.openclaw/workspace/scripts/team-optimization.sh
```

### 查看复盘结果
```bash
cat ~/.openclaw/workspace/agents/cto/DAILY_REVIEW.md
```

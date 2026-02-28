---
name: agent-review
description: 分析 Agent 工作表现，生成每日复盘报告。用于每日复盘、绩效分析、改进建议生成。
---

# Agent Review Skill

分析 Agent 的工作表现，生成复盘报告。

## 使用场景

- 每日复盘
- 绩效分析
- 改进建议生成

## 使用方法

### 直接运行

```bash
node ~/.openclaw/workspace/skills/agent-review/index.js <agent_id>
```

### 代码调用

```javascript
const { main } = require('./skills/agent-review');
main('cto'); // 返回 CTO 的复盘报告
```

### 支持的 Agent

- cfo, cto, cpo, cmo, sec, dev, hr, main

## 输出

复盘报告将写入: `~/.openclaw/workspace/agents/<agent_id>/DAILY_REVIEW.md`

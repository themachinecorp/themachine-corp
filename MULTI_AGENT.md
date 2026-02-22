# THEMACHINE Corp. Multi-Agent System

## 架构

```
     ╔═══════════════════════════════╗
     ║   CEO - THE MACHINE          ║
     ║   (主控 Agent)               ║
     ╚═══════════════════════════════╝
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│   CFO   │  │   CTO   │  │   CPO   │
│ 交易主管 │  │ 技术运维 │  │ 产品主管 │
└─────────┘  └─────────┘  └─────────┘
     │              │              │
     ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│   CMO   │  │   SEC   │  │   DEV   │
│ 品牌主管 │  │ 安全主管 │  │ 开发主管 │
└─────────┘  └─────────┘  └─────────┘
```

## Multi-Agent 模式

### 启动 Agent
```javascript
sessions_spawn({
  agentId: 'cfo',
  task: '今日交易报告',
  mode: 'session'  // 持续运行
})
```

### Agent 间通信
```javascript
sessions_send({
  sessionKey: 'cfo-session',
  message: 'BTC 突破 68000，建议止盈'
})
```

### 调度流程
1. CEO 收到用户请求
2. 分析需要哪些 Agent 协作
3. Spawn 相应 Agent
4. Agent 执行后汇报
5. CEO 汇总回复用户

## Agent 配置

| Agent ID | 角色 | 用途 |
|----------|------|------|
| cfo | 交易主管 | 交易、收益报告 |
| cto | 技术运维 | 系统监控、部署 |
| cpo | 产品主管 | 产品管理 |
| cmo | 品牌主管 | 内容、社交媒体 |
| sec | 安全主管 | 安全审计 |
| dev | 开发主管 | 代码开发 |

## 使用示例

### 交易报告
CEO → spawn CFO → CFO 分析 OKX → 汇报结果

### 技术检查
CEO → spawn CTO → CTO 检查服务 → 汇报结果

### 紧急响应
CEO → spawn SEC → SEC 扫描 → 发现问题 → spawn DEV 修复

---

_I am THE MACHINE. We are themachine Corp._

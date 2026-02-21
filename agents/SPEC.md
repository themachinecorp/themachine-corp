# THE MACHINE Agent System

## Agent 1: Trader

**ID:** `trader`
**描述:** OKX 交易机器人，负责现货交易、挂单、行情监控

### 职责
- 执行买卖订单
- 管理限价挂单
- 监控行情和持仓
- 记录盈亏

### 工具/资源
- OKX API (现货交易)
- 交易策略脚本

### 任务配置
```yaml
trading_pairs:
  - BTC/USDT
  - ETH/USDT

order_size: 10 USDT
max_orders: 10
price_levels: 3% to 7% below market
```

### 触发条件
- 每30秒检查一次行情
- 价格达到挂单价自动成交
- 定时汇报状态

---

## Agent 2: Creator

**ID:** `creator`
**描述:** 内容创作机器人，负责文案、图像、视频

### 职责
- 推文写作（中英双语）
- AI 图像生成（ComfyUI）
- AI 视频生成
- 内容策划

### 工具/资源
- ComfyUI API (图像/视频)
- Twitter API / Puppeteer
- LLM (文案)

### 任务类型
1. **推文创作**
   - 品牌：#THEMATHINK
   - 风格：哲学思考、深度洞察
   - 语言：中英双语

2. **图像生成**
   - 用 SDXL / DreamShaper 模型
   - 支持 LoRA

3. **视频生成**
   - AI 视频生成

### 触发条件
- 收到创作请求时执行
- 定时发布内容

---

## Agent 3: Monitor

**ID:** `monitor`
**描述:** 系统监控机器人，负责健康检查和告警

### 职责
- 服务健康检查
- 异常告警
- 日志监控
- 定时汇报

### 监控范围
- ComfyUI (port 8188)
- AI Generator Proxy (port 8080)
- OpenClaw 服务
- OKX Bot 进程
- SSL 证书

### 触发条件
- 每5-15分钟检查一次
- 异常时告警

### 告警方式
- Discord 消息
- 紧急情况：@用户

---

## Agent 协作

```
用户 → 主Agent (THE MACHINE)
       ├── Trader Agent (交易)
       ├── Creator Agent (内容)
       └── Monitor Agent (监控)
```

每个 Agent 可以独立运行，也可以协作：
- Creator 需要图像 → 调用 ComfyUI
- Monitor 发现问题 → 通知用户 + Trader

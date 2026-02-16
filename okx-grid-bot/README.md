# OKX 网格交易机器人

## 快速开始

### 1. 配置 API

```bash
export OKX_API_KEY="your_api_key"
export OKX_SECRET_KEY="your_secret_key"
export OKX_PASSPHRASE="your_passphrase"
```

### 2. 运行

```bash
cd okx-grid-bot
node index.js
```

## 策略说明

网格交易在价格区间内自动低买高卖：
- 价格下跌到某个网格 → 买入
- 价格上涨到某个网格 → 卖出

## 配置参数

在 `index.js` 中修改：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| symbol | 交易对 | USDT/USDC |
| gridCount | 网格数量 | 10 |
| gridSpread | 网格间距 | 0.1% |
| baseOrderValue | 每格订单价值 | 10 USDT |
| testMode | 测试模式 | true |

## 风险提示

⚠️ 交易有风险，请谨慎使用。建议先用测试模式验证。

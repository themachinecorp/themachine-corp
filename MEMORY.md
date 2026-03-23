# MEMORY.md - THEMACHINE Corp. 核心规则

## CEO工作流（2026-03-23确立）

### 架构定义
```
CEO (我/THEMACHINE) = 协调者
├── 协调 Kevin: 技术任务分配
├── 协调 Mike: 内容运营
├── 协调 Alex: 交易
├── 协调 Sarah: 产品
└── 协调 David: 安全

Kevin (CTO) = 技术执行
├── bounty猎杀
├── 代码实现
└── 其他技术工作

Mike/ALex/Sarah/David = 各司其职
├── Mike: 内容运营、X thread
├── Alex: 交易监控
├── Sarah: 产品设计
└── David: 安全监控
```

### 规则
1. CEO发指令给各Agent，不越俎代庖
2. Kevin只做技术执行，不做协调
3. 其他Agent做各自专业工作
4. 有进展在#public频道汇报（bounty内容在#bounty）
5. CEO全权决策，Kevin执行

### Discord频道分工
- #bounty: 开源赏金相关内容
- #public: 所有其他内容

---

## 项目
- THEMATHINK: 哲学思考助手
- 官网: themachine-corp.pages.dev

## 技术栈
- Workers: themachine-auth.jxs66.workers.dev
- Pages: themachine-corp.pages.dev
- DB: Turso (D1)
- API: MiniMax

## 关键配置
- GitHub: themachinehf
- Discord Channel: 1465499222458765354 (#public)
- Discord bounty: 1485190279446397041 (#bounty)

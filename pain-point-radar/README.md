# 🎯 Pain Point Radar

自动扫描 HN/GitHub/HuggingFace/Reddit 等数据源，识别用户痛点并生成报告。

## 快速开始

```bash
# 安装依赖
npm install

# 扫描数据源
npm run scan

# 生成报告
npm run report
```

## 数据源

- Hacker News (Trending)
- GitHub Trending
- HuggingFace Papers
- Reddit (r/MachineLearning, r/AI)
- AI 博客 RSS

## 项目结构

```
src/
├── scanners/      # 数据源扫描器
├── analyzer/      # 分析模块
├── reporter/      # 报告生成
├── storage/       # 数据库存储
└── models/        # 数据模型

scripts/
├── scan.js        # 扫描脚本
└── report.js      # 报告脚本
```

## 调度

可配合 cron 或 OpenClaw cron 使用:

```bash
# 每日 6:00 UTC 执行
0 6 * * * cd ~/projects/pain-point-radar && npm run scan && npm run report
```

# 免费痛点系统 - 架构设计

## 1. 系统概述

| 项目 | 描述 |
|------|------|
| 系统名 | Pain Point Radar |
| 功能 | 自动扫描多平台，识别用户痛点 |
| 数据源 | HN, GitHub Trending, HuggingFace, Reddit, AI Blogs RSS |

---

## 2. 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Pain Point Radar                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Scanner │  │ Analyzer │  │ Reporter │              │
│  │  (采集)   │  │  (分析)   │  │  (报告)   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│  ┌────┴─────────────┴─────────────┴────┐               │
│  │           Data Layer                 │               │
│  │  ┌─────────┐  ┌─────────┐           │               │
│  │  │ SQLite  │  │  Cache  │            │               │
│  │  │ (存储)   │  │ (Redis) │            │               │
│  │  └─────────┘  └─────────┘           │               │
│  └──────────────────────────────────────┘               │
│                         │                               │
│  ┌──────────────────────┴──────────────────┐           │
│  │           Data Sources (5个)            │           │
│  │  HN | GitHub | HuggingFace | Reddit |  │           │
│  │  RSS                                        │           │
│  └───────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 核心模块

### 3.1 Scanner (采集层)

| 模块 | 功能 | 技术 |
|------|------|------|
| HN Scanner | 抓取 HN trending | `hacker-news-api` |
| GitHub Scanner | 抓取 GitHub trending | GitHub REST API |
| HF Scanner | 抓取 HuggingFace papers | HF API |
| Reddit Scanner | 抓取 Reddit 讨论 | Reddit API |
| RSS Scanner | 抓取 AI 博客 | `rss-parser` |

### 3.2 Analyzer (分析层)

- **关键词提取**: TF-IDF / LLM 提取痛点关键词
- **热度计算**: upvotes + comments + recency
- **分类**: 技术难度 / 市场需求 / 解决方案稀缺

### 3.3 Reporter (报告层)

- 每日报告生成 (Markdown/JSON)
- 推送到 Discord/Telegram
- 存储到 Notion (可选)

---

## 4. 数据存储

### SQLite 表结构

```sql
CREATE TABLE pain_points (
  id TEXT PRIMARY KEY,
  conclusion TEXT NOT NULL,
  evidence_url TEXT,
  source TEXT,
  next_action TEXT,
  status TEXT DEFAULT 'discovered',
  created_at TEXT,
  validated_at TEXT
);

CREATE INDEX idx_source ON pain_points(source);
CREATE INDEX idx_status ON pain_points(status);
```

---

## 5. 调度策略

| 任务 | 频率 | 时间 |
|------|------|------|
| 扫描数据源 | 每日 | 06:00 UTC |
| 生成报告 | 每日 | 07:00 UTC |
| 汇总分析 | 每周一 | 06:00 UTC |

---

## 6. 部署方案

### 选项 A: Serverless (推荐入门)

- **平台**: Vercel / Cloudflare Workers
- **触发**: Cron (每日)
- **存储**: SQLite (libsql) + Redis

### 选项 B: Docker (自托管)

```yaml
services:
  radar:
    image: themachine/radar
    volumes:
      - ./data:/app/data
    cron:
      "0 6 * * *"
```

### 选项 C: 嵌入 OpenClaw

- 作为 MCP 工具集成
- Agent: `pain-point-radar`
- 定时任务 via `openclaw cron`

---

## 7. 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | Python / TypeScript |
| 存储 | SQLite (libsql) |
| 缓存 | Redis |
| 调度 | Cron / OpenClaw Cron |
| 通知 | Discord Webhook / Telegram Bot |

---

## 8. 实施路线

| 阶段 | 任务 | 预估 |
|------|------|------|
| 1 | 搭建基础框架 + HN Scanner | 2h |
| 2 | 集成其他 4 个数据源 | 3h |
| 3 | 实现 Analyzer + 报告生成 | 2h |
| 4 | 配置 Cron + 通知 | 1h |
| 5 | 测试 + 优化 | 2h |

**总计**: ~10 小时

---

## 9. 立即行动

```bash
# 1. 创建项目
mkdir -p ~/projects/pain-point-radar
cd ~/projects/pain-point-radar

# 2. 初始化
npm init -y
npm install @hacker-news/api-typed rss-parser axios

# 3. 首次手动扫描
node scripts/scan-hn.js
```

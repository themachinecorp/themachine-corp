# AI Content Site + Affiliate Marketing Project

## 细分领域选择
**技术教程（AI、编程）**

选择理由：
- 蓝海领域，竞争相对较小
- 市场需求持续增长
- 容易与AI生成内容结合
- 广告联盟匹配度高（技术产品、编程工具等）

## 项目目标
- **全自动运行**：7x24 小时不需要人工干预
- **变现方式**：Google AdSense 广告 + 亚马逊联盟
- **完全 AI**：内容由 AI 生成

## 项目结构

```
ai-content-site/
├── README.md
├── scripts/
│   ├── content-generator.js  # AI 内容生成
│   └── deploy.sh              # 部署脚本
├── website/                   # Hexo 网站
│   ├── source/
│   │   ├── _posts/           # 文章目录
│   │   ├── about/            # 关于页面
│   │   └── index.md           # 首页
│   ├── package.json
│   ├── _config.yml
│   └── public/               # 构建输出
├── vercel.json               # Vercel 配置
└── .github/workflows/        # CI/CD
```

## 快速开始

### 1. 安装依赖

```bash
cd website
npm install
```

### 2. 配置环境变量

```bash
export AI_API_KEY=your_openai_api_key
export CONTENT_LANGUAGE=English
```

### 3. 生成内容

```bash
node scripts/content-generator.js
```

### 4. 本地预览

```bash
cd website
npm run dev
```

### 5. 构建

```bash
npm run build
```

### 6. 部署

```bash
# Vercel
vercel --prod

# 或使用部署脚本
../scripts/deploy.sh all
```

## 部署到 Vercel

1. 在 Vercel 创建新项目
2. 导入 GitHub 仓库
3. 配置环境变量（可选）：
   - `AI_API_KEY` - OpenAI API key
   - `CONTENT_LANGUAGE` - 内容语言
4. Deploy！

## GitHub Actions 自动部署

在 GitHub 仓库设置中添加以下 Secrets：
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## 内容模板

支持的 AI 内容模板：

| 类型 | 描述 |
|------|------|
| tutorial | 详细教程 |
| guide | 实用指南 |
| review | 产品评测 |
| news | 新闻报道 |

## 文章主题

自动生成的主题类别：

- **Python** - 类型提示、异步编程、FastAPI 等
- **AI/ML** - Transformer、RAG、Stable Diffusion 等
- **Web开发** - Next.js、React、TypeScript 等
- **DevOps** - Docker、Kubernetes、CI/CD 等

## 成功指标

| 阶段 | 时间 | 指标 |
|------|------|------|
| MVP | Week 1 | 网站上线，首批 10 篇内容 |
| 增长 | Week 4 | 月活 1,000+，首笔收入 |
| 成熟 | Week 12 | 月活 10,000+，月收入 $500+ |

## 进度

### Week 1 (进行中)
- [x] 选择细分领域
- [x] 创建项目结构
- [x] 网站搭建
- [x] 内容生成系统
- [x] 发布系统
- [ ] 部署上线

## 命令参考

```bash
# 安装
npm install

# 开发预览
npm run dev

# 构建
npm run build

# 生成内容
node ../scripts/content-generator.js

# 部署
vercel --prod
```

## 输出要求

1. **每晚汇报进度** (22:00)
   - 完成的任务
   - 遇到的问题
   - 明天的计划

2. **每周总结**
   - 本周完成度
   - 下周计划
   - 收入数据

3. **GitHub 提交**
   - 每天至少 1 次提交
   - 清晰的提交信息

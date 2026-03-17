# Pain Point Analyzer

AI 驱动的痛点分析工具 - 输入产品/想法，AI 分析用户痛点

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 OpenAI API Key

# 3. 运行开发服务器
npm run dev

# 4. 打开 http://localhost:3000
```

## 功能

- [x] 痛点分析 - 输入产品描述，AI 生成痛点列表
- [x] 严重程度 - 每个痛点的严重程度评分
- [x] 验证功能 - 验证痛点是否真实存在 (开发中)
- [x] 解决方案推荐 (开发中)
- [ ] 用户系统 (开发中)
- [ ] 支付集成 (开发中)

## 定价

| 套餐 | 价格 | 功能 |
|------|------|------|
| 免费版 | ¥0 | 每天 3 次 |
| 付费版 | ¥29/月 | 无限次 |

## 技术栈

- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- OpenAI API (GPT-4)

## 项目结构

```
src/
├── app/
│   ├── page.tsx      # 主页面
│   ├── layout.tsx    # 布局
│   └── globals.css   # 全局样式
├── lib/
│   └── ai.ts         # AI 分析逻辑
└── components/       # 组件 (待添加)
```

## 开发计划

- [ ] MVP (Week 1)
- [ ] 增强功能 (Week 2)
- [ ] 商业化 (Week 3)
- [ ] 上线 (Week 4)

## License

MIT

# THEMATHINK Newsletter 技术实现方案

## 一、技术架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    THEMATHINK Newsletter                │
├─────────────────────────────────────────────────────────┤
│  内容层          │  发送层          │  数据层           │
│  ─────────────  │  ─────────────  │  ─────────────    │
│  Markdown渲染    │  邮件服务商      │  订阅用户数据库    │
│  模板引擎        │  发送队列        │  发送日志          │
│  静态站点        │  退订处理        │  打开/点击统计     │
└─────────────────────────────────────────────────────────┘
```

---

## 二、技术选型

### 2.1 邮件发送服务

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **Mailgun** | 送达率高、API 完善、价格合理 | 需要技术配置 | 自建系统 |
| **SendGrid** | 企业级、稳定 | 成本较高 | 规模化运营 |
| **Resend** | 现代 API、易用 | 较新 | 快速启动 |
| **Substack** | 零技术门槛、内置订阅 | 定制受限 | 快速验证 |

**推荐**：初期用 Substack 快速验证，后期迁移自建

### 2.2 内容管理系统

| 方案 | 技术栈 | 适用规模 |
|------|--------|----------|
| **Notion + API** | Notion + Serverless | 小型（<1万） |
| **静态站点** | Next.js + Markdown | 中型（<10万） |
| **自建 CMS** | Node.js + 数据库 | 大型（>10万） |

---

## 三、核心模块设计

### 3.1 订阅系统

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing    │     │   订阅确认    │     │   用户管理    │
│   Page       │────▶│   邮件        │────▶│   后台        │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                        │
       ▼                                        ▼
┌──────────────┐                        ┌──────────────┐
│  订阅 API    │                        │   数据库      │
└──────────────┘                        └──────────────┘
```

**功能清单**：
- [x] 邮箱订阅（单选/双opt-in）
- [x] 退订管理（一键退订）
- [x] 频率设置（每日/每周）
- [x] 偏好管理（兴趣标签）

### 3.2 内容渲染

```javascript
// 内容模板示例 (Markdown → HTML)
const renderNewsletter = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px 20px; }
        .content { padding: 20px; line-height: 1.8; }
        .cta { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📡 THEMATHINK Radar</h1>
        <p>哲学级 AI 思考助手</p>
      </div>
      <div class="content">
        ${markdownToHtml(content)}
      </div>
    </body>
    </html>
  `;
};
```

### 3.3 发送队列

```
定时任务 (每周三 18:00)
       │
       ▼
┌──────────────────┐
│  获取当期刊物    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  渲染 HTML 模板  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  分批发送 (100/批)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  记录发送日志    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  统计发送结果    │
└──────────────────┘
```

---

## 四、数据模型

### 4.1 订阅用户表

```sql
CREATE TABLE subscribers (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',  -- pending/active/unsubscribed
  interests       JSONB,                            -- ["AI", "哲学", "创业"]
  subscribed_at   TIMESTAMP DEFAULT NOW(),
  confirmed_at    TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  source          VARCHAR(50)                      -- landing/social/partner
);
```

### 4.2 发送日志表

```sql
CREATE TABLE send_logs (
  id            UUID PRIMARY KEY,
  newsletter_id VARCHAR(50),
  email         VARCHAR(255),
  status        VARCHAR(20),    -- sent/failed/bounced
  sent_at       TIMESTAMP,
  opened_at     TIMESTAMP,
  clicked_at    TIMESTAMP,
  metadata      JSONB
);
```

---

## 五、关键技术实现

### 5.1 发送平台集成（Mailgun 示例）

```javascript
// 发送邮件
const sendNewsletter = async (to, html, subject) => {
  const response = await fetch('https://api.mailgun.net/v3/{domain}/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      from: 'THEMATHINK <noreply@themathink.com>',
      to,
      subject,
      html,
      'o:tracking-clicks': 'yes',
      'o:tracking-opens': 'yes',
    }),
  });
  return response.json();
};
```

### 5.2 退订处理

```javascript
// 退订 API
app.post('/unsubscribe', async (req, res) => {
  const { email, token } = req.body;
  
  // 验证 token
  const valid = verifyUnsubscribeToken(email, token);
  if (!valid) return res.status(400).json({ error: 'Invalid token' });
  
  // 更新状态
  await db.subscribers.update(
    { email },
    { status: 'unsubscribed', unsubscribed_at: new Date() }
  );
  
  return res.json({ success: true });
});
```

### 5.3 统计追踪

```javascript
// 打开追踪（1x1 像素图）
app.get('/open/:newsletterId/:subscriberId', async (req, res) => {
  await db.sendLogs.update(
    { newsletter_id: req.params.newsletterId, email: req.params.subscriberId },
    { opened_at: new Date() }
  );
  
  // 返回 1x1 透明 GIF
  res.setHeader('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

// 点击追踪
const trackClick = (url, newsletterId, subscriberId) => {
  return `https://themathink.com/click?u=${encodeURIComponent(url)}&n=${newsletterId}&s=${subscriberId}`;
};
```

---

## 六、部署方案

### 6.1 基础设施

| 组件 | 方案 | 成本 |
|------|------|------|
| 前端/ Landing | Vercel | 免费 |
| 后端 API | Vercel Serverless | 免费 |
| 数据库 | Supabase / Neon | 免费 |
| 邮件发送 | Mailgun | $35/月起 |
| 域名/SSL | Cloudflare | 免费 |

### 6.2 CI/CD

```yaml
# GitHub Actions
name: Deploy Newsletter
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

---

## 七、开发里程碑

| 阶段 | 任务 | 时间 |
|------|------|------|
| Phase 1 | 基础架构搭建（Landing + 订阅） | Week 1 |
| Phase 2 | 邮件发送系统 | Week 2 |
| Phase 3 | 数据追踪与统计 | Week 3 |
| Phase 4 | 测试与优化 | Week 4 |
| Phase 5 | 首期发送与验证 | Week 5 |

---

## 八、监控指标

| 指标 | 告警阈值 | 优化目标 |
|------|----------|----------|
| 送达率 | < 95% | > 98% |
| 打开率 | < 20% | > 40% |
| 点击率 | < 2% | > 8% |
| 退订率 | > 1% | < 0.5% |

---

*技术方案完成时间：2026-03-12*
*设计者：CPO Sarah*

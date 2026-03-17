# THEMATHINK Newsletter 发送系统设计

## 一、系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│                      Newsletter Delivery System                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │  Content │───▶│  Render │───▶│  Queue  │───▶│  Email  │      │
│  │  Engine  │    │  Engine │    │  Worker │    │  Gateway│      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│       │              │              │              │            │
│       ▼              ▼              ▼              ▼            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Data Layer                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │Campaigns │  │Subscribers│  │Templates │  │ Logs   │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、核心模块

### 2.1 Campaign Manager（Campaign 管理）

```typescript
interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  content: NewsletterContent;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  stats: CampaignStats;
}

interface NewsletterContent {
  cover: CoverSection;
  sections: Section[];
  cta?: CTA;
}

interface Section {
  type: 'signal' | 'insight' | 'toolkit' | '互动';
  title: string;
  items: ContentItem[];
}
```

### 2.2 Template Engine（模板引擎）

```typescript
// 模板渲染流程
const renderCampaign = async (campaign: Campaign, subscriber: Subscriber) => {
  // 1. 加载模板
  const template = await loadTemplate('weekly-radar');
  
  // 2. 注入用户数据（个性化）
  const context = {
    ...campaign.content,
    subscriber: {
      name: subscriber.name || '思考者',
      email: subscriber.email,
    },
    tracking: {
      openPixel: generateOpenPixel(campaign.id, subscriber.id),
      links: campaign.content.sections.flatMap(s => 
        s.items.map(item => ({
          original: item.link,
          tracked: generateClickPixel(item.link, campaign.id, subscriber.id)
        }))
      )
    },
    unsubscribeUrl: generateUnsubscribeLink(subscriber),
  };
  
  // 3. 渲染 HTML
  const html = await template.render(context);
  
  // 4. 生成纯文本版本
  const text = await generatePlainText(context);
  
  return { html, text };
};
```

### 2.3 Queue Worker（发送队列）

```typescript
// 队列配置
const QUEUE_CONFIG = {
  batchSize: 100,           // 每批发送数量
  batchDelay: 100,          // 批次间隔 (ms)
  retryAttempts: 3,         // 重试次数
  retryDelay: 1000,         // 重试间隔 (ms)
  rateLimit: 100,           // 每秒发送上限
};

// 发送流程
class DeliveryWorker {
  async processQueue(campaignId: string) {
    const campaign = await db.campaigns.get(campaignId);
    const subscribers = await db.subscribers.getActive({
      batch: QUEUE_CONFIG.batchSize
    });
    
    for (const subscriber of subscribers) {
      try {
        // 渲染个性化内容
        const { html, text } = await this.renderCampaign(campaign, subscriber);
        
        // 发送邮件
        await this.sendEmail(subscriber.email, {
          subject: campaign.subject,
          html,
          text,
        });
        
        // 记录发送日志
        await db.sendLogs.create({
          campaignId,
          subscriberId: subscriber.id,
          status: 'sent',
          sentAt: new Date(),
        });
        
        // 限流控制
        await this.rateLimit();
        
      } catch (error) {
        await this.handleError(campaignId, subscriber, error);
      }
    }
  }
}
```

### 2.4 Email Gateway（邮件网关）

```typescript
// 多网关支持
interface EmailProvider {
  send(to: string, message: EmailMessage): Promise<SendResult>;
  getRateLimit(): { remaining: number; resetAt: Date };
}

class GatewayRouter {
  private providers: Map<string, EmailProvider>;
  
  // 路由策略
  async route(email: string, message: EmailMessage): Promise<SendResult> {
    // 根据邮箱域名选择最优网关
    const provider = this.selectProvider(email);
    
    try {
      return await provider.send(email, message);
    } catch (error) {
      // 失败时尝试备用网关
      return await this.fallback(email, message);
    }
  }
  
  private selectProvider(email: string): EmailProvider {
    const domain = email.split('@')[1];
    // Gmail 走 Google Cloud，QQ 走国内服务商等
    if (['gmail.com', 'qq.com', '163.com'].includes(domain)) {
      return this.providers.get('primary');
    }
    return this.providers.get('default');
  }
}
```

---

## 三、发送流程（状态机）

```
┌─────────┐
│  Draft  │
└────┬────┘
     │ publish
     ▼
┌─────────┐    ┌─────────────┐
│ Ready   │───▶│ Scheduled   │
└────┬────┘    └──────┬──────┘
     │                │ (到达定时)
     ▼                ▼
┌─────────────────────────────────────────┐
│              Sending                    │
│  ┌─────────────────────────────────┐   │
│  │  Batch 1 ──▶ Batch 2 ──▶ ...   │   │
│  └─────────────────────────────────┘   │
└────┬────┘
     │ (全部完成)
     ▼
┌─────────┐    ┌─────────────┐
│  Sent   │◀───│ Completed   │
└─────────┘    └─────────────┘
     │
     │ (有失败)
     ▼
┌─────────────────────────────────────────┐
│         Retry Failed                    │
│  [重试失败邮件] → [标记失败]              │
└─────────────────────────────────────────┘
```

---

## 四、追踪系统

### 4.1 打开追踪

```typescript
// 1x1 透明像素
app.get('/open/:campaignId/:subscriberId.png', async (req, res) => {
  const { campaignId, subscriberId } = req.params;
  
  // 记录打开
  await db.sendLogs.update(
    { campaignId, subscriberId },
    { 
      opened: true,
      openedAt: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    }
  );
  
  // 返回透明 GIF
  res.setHeader('Content-Type', 'image/gif');
  res.send(TRANSPARENT_GIF);
});
```

### 4.2 点击追踪

```typescript
// 点击链接
app.get('/click', async (req, res) => {
  const { url, campaignId, subscriberId } = req.query;
  
  // 记录点击
  await db.clickLogs.create({
    campaignId,
    subscriberId,
    url,
    clickedAt: new Date(),
  });
  
  // 跳转原链接
  res.redirect(url as string);
});
```

---

## 五、可靠性设计

### 5.1 失败处理

```typescript
// 重试策略
const retryPolicy = {
  maxAttempts: 3,
  backoff: 'exponential',
  delays: [1000, 5000, 30000],  // 1s, 5s, 30s
  
  shouldRetry: (error: Error) => {
    // 临时错误重试
    if (error.code === 'TEMPORARY_FAILURE') return true;
    // 永久错误不重试
    if (error.code === 'INVALID_EMAIL') return false;
    return true;
  }
};
```

### 5.2 幂等性保证

```typescript
// 幂等发送
async function sendWithIdempotency(campaignId: string, subscriberId: string) {
  // 检查是否已发送
  const existing = await db.sendLogs.find({ campaignId, subscriberId });
  if (existing?.status === 'sent') {
    console.log('Already sent, skipping');
    return { status: 'already_sent' };
  }
  
  // 发送并记录
  return await doSend(campaignId, subscriberId);
}
```

---

## 六、API 设计

### 6.1 管理接口

| Method | Endpoint | 描述 |
|--------|----------|------|
| POST | /api/campaigns | 创建 Campaign |
| GET | /api/campaigns/:id | 获取 Campaign |
| PUT | /api/campaigns/:id | 更新 Campaign |
| POST | /api/campaigns/:id/send | 立即发送 |
| POST | /api/campaigns/:id/schedule | 定时发送 |
| GET | /api/campaigns/:id/stats | 获取统计数据 |

### 6.2 订阅接口

| Method | Endpoint | 描述 |
|--------|----------|------|
| POST | /api/subscribe | 订阅 |
| POST | /api/unsubscribe | 退订 |
| GET | /api/preferences | 获取偏好 |
| PUT | /api/preferences | 更新偏好 |

---

## 七、部署配置

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    image: themathink/newsletter-api
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MAILGUN_API_KEY=${MAILGUN_API_KEY}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 2
      
  worker:
    image: themathink/newsletter-worker
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MAILGUN_API_KEY=${MAILGUN_API_KEY}
      - REDIS_URL=${REDIS_URL}
    deploy:
      replicas: 4
      
  redis:
    image: redis:7-alpine
    deploy:
      replicas: 3
```

---

## 八、监控告警

| 指标 | 阈值 | 动作 |
|------|------|------|
| 发送失败率 | > 5% | 告警 + 暂停 |
| 送达率 | < 95% | 告警 |
| 响应延迟 | > 2s | 告警 |
| 队列积压 | > 1000 | 告警 |

---

## 九、交付物清单

| 文件 | 描述 |
|------|------|
| `delivery-system.ts` | 核心发送系统代码 |
| `queue-worker.ts` | 队列处理器 |
| `email-provider.ts` | 邮件网关抽象 |
| `tracking.ts` | 追踪系统 |
| `api-routes.ts` | API 接口 |
| `docker-compose.yml` | 部署配置 |

---

*发送系统设计完成：2026-03-12*
*设计者：CPO Sarah*

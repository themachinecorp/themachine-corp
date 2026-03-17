# THEMATHINK Newsletter 自动重试系统设计

## 一、重试策略概述

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **幂等性** | 同一邮件不会发送多次 |
| **可观测性** | 每个步骤都有日志记录 |
| **快速失败** | 永久性错误立即标记，不重试 |
| **指数退避** | 重试间隔逐渐增加，避免拥堵 |
| **可配置** | 支持按邮件类型、用户分群调整策略 |

### 1.2 重试流程图

```
发送任务创建
       │
       ▼
┌──────────────┐
│  首次尝试    │──── 成功 → 标记完成 → 记录日志
└──────┬───────┘
       │ 失败
       ▼
┌──────────────┐
│  错误分类    │
└──────┬───────┘
       │
       ├─ 临时错误 ──→ 加入重试队列
       │
       ├─ 限流错误 ──→ 等待后重试
       │
       └─ 永久错误 ──→ 标记失败 → 人工处理
       
重试队列 (最多 3 次)
       │
       ▼
   指数退避等待
       │
       ▼
   再次尝试
       │
       ├─ 成功 ──→ 标记完成
       │
       └─ 失败 ──→ 继续重试或标记失败
```

---

## 二、错误分类与处理

### 2.1 错误类型矩阵

```typescript
// 错误类型定义
const errorTypes = {
  // 临时错误 - 需要重试
  TEMPORARY: {
    codes: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '500', '502', '503', '504'],
    retry: true,
    retryStrategy: 'exponential',
    maxRetries: 3,
  },
  
  // 限流错误 - 等待后重试
  RATE_LIMIT: {
    codes: ['429', 'rate_limit_exceeded'],
    retry: true,
    retryStrategy: 'linear',
    maxRetries: 5,
    waitTime: 60000, // 60秒
  },
  
  // 临时拒绝 - 软退回
  SOFT_BOUNCE: {
    codes: ['mailbox_full', 'too_large', 'content_rejected'],
    retry: true,
    retryStrategy: 'constant',
    maxRetries: 2,
    waitTime: 3600000, // 1小时后重试
  },
  
  // 永久错误 - 不重试
  PERMANENT: {
    codes: [
      'invalid_email',
      'user_unknown', 
      'mailbox_not_found',
      'unsubscribed',
      'blocked',
      'spam_complaint',
    ],
    retry: false,
    action: 'mark_failed',
  },
};

// 错误处理决策树
function classifyError(error: MailgunError): ErrorClassification {
  const { status, code, message } = error;
  
  // 检查是否是限流
  if (status === 429) {
    return { 
      type: 'RATE_LIMIT', 
      retryAfter: parseInt(message.retryAfter) || 60 
    };
  }
  
  // 检查是否是永久错误
  if (PERMANENT_CODES.some(c => message.includes(c))) {
    return { type: 'PERMANENT', reason: message };
  }
  
  // 检查是否是 5xx
  if (status >= 500) {
    return { type: 'TEMPORARY', attempt: 1 };
  }
  
  // 默认按临时错误处理
  return { type: 'TEMPORARY', attempt: 1 };
}
```

### 2.2 重试策略配置

```typescript
// 重试配置
const retryConfig = {
  // 全局配置
  global: {
    maxRetries: 3,
    initialDelay: 1000,    // 1秒
    maxDelay: 300000,      // 5分钟
    backoffMultiplier: 2,  // 指数退避
    jitter: true,          // 添加随机抖动
  },
  
  // 按错误类型配置
  byErrorType: {
    TEMPORARY: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    },
    RATE_LIMIT: {
      maxRetries: 5,
      initialDelay: 60000,
      maxDelay: 600000,
      backoffMultiplier: 1.5,
    },
    SOFT_BOUNCE: {
      maxRetries: 2,
      initialDelay: 3600000,
      maxDelay: 86400000,
      backoffMultiplier: 1,
    },
  },
  
  // 按用户分群配置
  bySegment: {
    vip: {
      maxRetries: 5,
      priority: 'high',
    },
    regular: {
      maxRetries: 3,
      priority: 'normal',
    },
    trial: {
      maxRetries: 1,
      priority: 'low',
    },
  },
};

// 计算重试延迟
function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // 限制最大延迟
  delay = Math.min(delay, config.maxDelay);
  
  // 添加随机抖动 (±10%)
  if (config.jitter) {
    const jitter = delay * 0.1;
    delay += (Math.random() * 2 - 1) * jitter;
  }
  
  return Math.floor(delay);
}
```

---

## 三、队列实现

### 3.1 消息队列架构

```typescript
// 队列消息结构
interface QueueMessage {
  id: string;
  type: 'send_email';
  payload: {
    campaignId: string;
    subscriberId: string;
    email: string;
    attempt: number;
    maxAttempts: number;
    createdAt: Date;
    lastAttemptAt?: Date;
    scheduledFor?: Date;
  };
  retryConfig?: {
    strategy: 'exponential' | 'linear' | 'constant';
    currentDelay: number;
  };
}

// Redis 队列实现
class EmailQueue {
  private redis: Redis;
  private processing = new Set<string>();
  
  // 添加到队列
  async enqueue(message: QueueMessage, delay?: number): Promise<void> {
    const key = `email:queue:${message.id}`;
    
    if (delay && delay > 0) {
      // 延迟发送
      await this.redis.zadd(
        'email:delayed',
        Date.now() + delay,
        JSON.stringify(message)
      );
    } else {
      // 立即发送
      await this.redis.lpush('email:pending', JSON.stringify(message));
    }
  }
  
  // 从队列获取
  async dequeue(count: number = 10): Promise<QueueMessage[]> {
    const messages = await this.redis.lrange(
      'email:pending',
      0,
      count - 1
    );
    
    // 标记正在处理
    for (const msg of messages) {
      this.processing.add(msg.id);
    }
    
    return messages.map(m => JSON.parse(m));
  }
  
  // 确认完成
  async acknowledge(messageId: string): Promise<void> {
    await this.redis.lrem('email:pending', 1, messageId);
    this.processing.delete(messageId);
  }
  
  // 处理失败，加入重试
  async retry(message: QueueMessage, error: Error): Promise<void> {
    const classification = classifyError(error);
    
    if (!classification.retry) {
      // 永久失败，记录并标记
      await this.markFailed(message, error.message);
      return;
    }
    
    // 计算下一次延迟
    const config = getRetryConfig(classification.type);
    const delay = calculateDelay(message.payload.attempt + 1, config);
    
    // 更新重试次数
    message.payload.attempt += 1;
    message.payload.lastAttemptAt = new Date();
    message.retryConfig = {
      strategy: config.backoffMultiplier > 1 ? 'exponential' : 'linear',
      currentDelay: delay,
    };
    
    if (message.payload.attempt >= message.payload.maxAttempts) {
      // 超过最大重试次数
      await this.markFailed(message, 'Max retries exceeded');
    } else {
      // 加入重试队列
      await this.enqueue(message, delay);
    }
  }
}
```

### 3.2 工作者进程

```typescript
// 邮件发送工作者
class EmailWorker {
  private queue: EmailQueue;
  private provider: EmailProvider;
  private running = false;
  
  async start(concurrency: number = 5) {
    this.running = true;
    
    while (this.running) {
      try {
        // 获取待发送邮件
        const messages = await this.queue.dequeue(concurrency);
        
        // 并发处理
        await Promise.all(
          messages.map(msg => this.processMessage(msg))
        );
        
        // 检查延迟队列
        await this.processDelayed();
        
        // 短暂休息
        await this.sleep(100);
        
      } catch (error) {
        console.error('Worker error:', error);
        await this.sleep(5000);
      }
    }
  }
  
  private async processMessage(message: QueueMessage) {
    const { campaignId, subscriberId, email } = message.payload;
    
    try {
      // 幂等检查
      const alreadySent = await this.checkIdempotency(campaignId, subscriberId);
      if (alreadySent) {
        await this.queue.acknowledge(message.id);
        return;
      }
      
      // 发送邮件
      await this.provider.send({
        to: email,
        campaignId,
      });
      
      // 记录成功
      await this.logSuccess(message);
      await this.queue.acknowledge(message.id);
      
    } catch (error) {
      // 处理失败
      await this.queue.retry(message, error);
      await this.queue.acknowledge(message.id);
    }
  }
  
  private async processDelayed() {
    const now = Date.now();
    const ready = await this.redis.zrangebyscore(
      'email:delayed',
      0,
      now
    );
    
    if (ready.length > 0) {
      // 移到待发送队列
      await this.redis.lpush(
        'email:pending',
        ...ready
      );
      await this.redis.zremrangebyscore(
        'email:delayed',
        0,
        now
      );
    }
  }
}
```

---

## 四、幂等性保障

### 4.1 幂等键设计

```typescript
// 幂等键生成
function generateIdempotencyKey(
  campaignId: string,
  subscriberId: string,
  action: string = 'send'
): string {
  return `${action}:${campaignId}:${subscriberId}:${Date.now().toString(36)}`;
}

// 幂等性检查
class IdempotencyService {
  private redis: Redis;
  private ttl = 7 * 24 * 60 * 60; // 7天
  
  async check(key: string): Promise<IdempotencyResult> {
    const existing = await this.redis.get(`idemp:${key}`);
    
    if (existing) {
      const result = JSON.parse(existing);
      return {
        exists: true,
        status: result.status,
        result: result.data,
      };
    }
    
    return { exists: false };
  }
  
  async set(key: string, status: 'pending' | 'success' | 'failed', data?: any) {
    await this.redis.setex(
      `idemp:${key}`,
      this.ttl,
      JSON.stringify({ status, data, timestamp: Date.now() })
    );
  }
  
  // 发送前检查
  async beforeSend(campaignId: string, subscriberId: string) {
    const key = `send:${campaignId}:${subscriberId}`;
    const result = await this.check(key);
    
    if (result.exists && result.status === 'success') {
      return { shouldSend: false, result: result.result };
    }
    
    // 标记为处理中
    await this.set(key, 'pending');
    return { shouldSend: true };
  }
  
  // 发送成功后更新
  async afterSuccess(campaignId: string, subscriberId: string, data: SendResult) {
    const key = `send:${campaignId}:${subscriberId}`;
    await this.set(key, 'success', data);
  }
  
  // 发送失败后更新
  async afterFailure(campaignId: string, subscriberId: string, error: string) {
    const key = `send:${campaignId}:${subscriberId}`;
    await this.set(key, 'failed', { error });
  }
}
```

### 4.2 状态追踪

```typescript
// 发送状态枚举
enum SendStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  SOFT_BOUNCED = 'soft_bounced',
}

// 状态记录
interface SendRecord {
  id: string;
  campaignId: string;
  subscriberId: string;
  email: string;
  status: SendStatus;
  attempts: number;
  lastAttemptAt: Date;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
  idempotencyKey: string;
}

// 状态更新
async function updateSendStatus(
  recordId: string,
  status: SendStatus,
  metadata?: Partial<SendRecord>
) {
  await db.sendRecords.update(recordId, {
    status,
    ...metadata,
    updatedAt: new Date(),
  });
}
```

---

## 五、监控与告警

### 5.1 重试监控指标

```typescript
// 重试相关指标
const retryMetrics = {
  // 计数器
  totalAttempts: new Counter('email_send_total'),
  successfulRetries: new Counter('email_retry_success_total'),
  failedRetries: new Counter('email_retry_failed_total'),
  
  // 直方图
  retryDelay: new Histogram('email_retry_delay_seconds', {
    buckets: [1, 5, 10, 30, 60, 300, 600],
  }),
  attemptsPerEmail: new Histogram('email_attempts_total', {
    buckets: [1, 2, 3, 4, 5, 10],
  }),
};

// 告警规则
const retryAlerts = {
  // 重试率过高
  highRetryRate: {
    metric: 'email_retry_rate',
    threshold: 0.1, // 10%
    window: '5m',
    severity: 'warning',
    message: 'Email retry rate is {{value}}%, above 10% threshold',
  },
  
  // 多次重试后仍失败
  persistentFailures: {
    metric: 'email_failed_after_retries',
    threshold: 50,
    window: '1h',
    severity: 'critical',
    message: '{{value}} emails failed after maximum retries',
  },
  
  // 重试延迟过高
  highRetryDelay: {
    metric: 'email_retry_delay_p99',
    threshold: 60, // 60秒
    window: '5m',
    severity: 'warning',
    message: 'Email retry delay P99 is {{value}}s',
  },
};
```

### 5.2 仪表盘展示

```
┌─────────────────────────────────────────────────────────────────┐
│                    重试系统监控仪表盘                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 实时状态                                                    │
│  ────────────────────────                                      │
│  正在处理: 156          待重试: 23          失败: 7            │
│                                                                 │
│  📈 重试率趋势 (过去1小时)                                      │
│        │                                                        │
│  15% ──┤                        ●                               │
│        │              ●                                         │
│  10% ──┤     ●                                                     │
│        │                                                         │
│   5% ──┤                                                         │
│        └───────────────                                         │
│            12:00  12:15  12:30  12:45  13:00                   │
│                                                                 │
│  🔄 重试次数分布                                                │
│  ────────────────────────                                      │
│  1次成功: ████████████████████  65%                            │
│  2次成功: ██████████           25%                              │
│  3次成功: ████                  8%                              │
│  失败:    ██                    2%                              │
│                                                                 │
│  ⚠️ 最近的失败                                                   │
│  ────────────────────────                                      │
│  • user@example.com - 邮箱不存在                                │
│  • test@fake.net - 域名无效                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、人工干预

### 6.1 失败邮件处理后台

```typescript
// 失败邮件列表查询
async function getFailedEmails(filters: {
  campaignId?: string;
  errorType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  const query = db.sendRecords
    .where('status')
    .equals('failed')
    .and(f => 
      (!filters.campaignId || f.campaignId === filters.campaignId) &&
      (!filters.dateFrom || f.failedAt >= filters.dateFrom) &&
      (!filters.dateTo || f.failedAt <= filters.dateTo)
    );
  
  return query
    .orderBy('failedAt', 'desc')
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);
}

// 手动重试
async function manualRetry(emailIds: string[]) {
  const records = await db.sendRecords.find({ id: { in: emailIds } });
  
  for (const record of records) {
    await queue.enqueue({
      id: generateId(),
      type: 'send_email',
      payload: {
        campaignId: record.campaignId,
        subscriberId: record.subscriberId,
        email: record.email,
        attempt: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      },
    });
  }
}

// 标记为永久失败
async function markPermanentFailure(emailIds: string[], reason: string) {
  await db.sendRecords.update(
    { id: { in: emailIds } },
    {
      status: 'failed',
      error: reason,
      requiresReview: true,
    }
  );
}
```

### 6.2 干预操作界面

```
┌─────────────────────────────────────────────────────────────────┐
│                   邮件发送管理后台                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  筛选条件：                                                    │
│  [ Campaign: #004      ] [ 状态: 失败      ] [ 搜索... ]       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ☐ │ 邮箱              │ 错误类型    │ 重试次数 │ 操作  │ │
│  ├───┼───────────────────┼─────────────┼──────────┼───────┤  │
│  │ ☐ │ test@fake.com     │ 永久(无效)  │ 3        │ [重试]│  │
│  │ ☐ │ fail@spam.com     │ 永久(拦截)  │ 3        │ [查看]│  │
│  │ ☐ │ box@full.com      │ 软退回      │ 2        │ [重试]│  │
│  │ ☐ │ timeout@test.com  │ 临时错误    │ 1        │ [重试]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  已选择 4 封 → [ 批量重试 ] [ 标记无效 ] [ 导出CSV ]           │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  📋 批量操作日志                                                │
│  ────────────────────                                          │
│  14:32 - 手动重试 3 封邮件                                      │
│  14:28 - 标记 2 封为永久失败                                    │
│  14:15 - 批量重试成功 23 封                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、日志记录

### 7.1 结构化日志

```typescript
// 重试日志结构
interface RetryLog {
  // 基础信息
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  
  // 上下文
  context: {
    campaignId: string;
    subscriberId: string;
    email: string;
    attempt: number;
    maxAttempts: number;
  };
  
  // 错误信息
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  
  // 重试信息
  retry?: {
    strategy: string;
    delay: number;
    nextAttemptIn: number;
  };
  
  // 结果
  result?: {
    status: 'success' | 'failed' | 'retry_scheduled';
    sentAt?: string;
    failureReason?: string;
  };
}

// 日志示例
const logExample: RetryLog = {
  timestamp: '2026-03-14T14:32:15.123Z',
  level: 'warn',
  message: 'Email send failed, scheduling retry',
  context: {
    campaignId: 'campaign_004',
    subscriberId: 'sub_12345',
    email: 'user@example.com',
    attempt: 1,
    maxAttempts: 3,
  },
  error: {
    code: 'ECONNREFUSED',
    message: 'Connection refused',
  },
  retry: {
    strategy: 'exponential',
    delay: 1000,
    nextAttemptIn: 2000,
  },
};
```

### 7.2 日志查询

```typescript
// 日志查询示例
const logQueries = {
  // 查询某封邮件的所有发送记录
  emailHistory: (campaignId: string, subscriberId: string) => `
    SELECT * FROM email_logs 
    WHERE campaign_id = '${campaignId}' 
    AND subscriber_id = '${subscriberId}'
    ORDER BY timestamp DESC
  `,
  
  // 查询所有重试记录
  retryHistory: (hours: number = 24) => `
    SELECT * FROM email_logs 
    WHERE message LIKE '%scheduling retry%'
    AND timestamp > now() - interval '${hours} hours'
  `,
  
  // 查询失败但未重试
  failedWithoutRetry: () => `
    SELECT * FROM send_records 
    WHERE status = 'failed' 
    AND attempt >= max_attempts
    AND created_at > now() - interval '24 hours'
  `,
};
```

---

## 八、配置参数总结

### 8.1 可配置项

| 参数 | 默认值 | 可选范围 | 说明 |
|------|--------|----------|------|
| `maxRetries` | 3 | 1-10 | 最大重试次数 |
| `initialDelay` | 1000ms | 100-60000 | 初始延迟 |
| `maxDelay` | 300000ms | 60000-3600000 | 最大延迟 |
| `backoffMultiplier` | 2 | 1-5 | 退避倍数 |
| `jitter` | true | true/false | 是否添加抖动 |
| `rateLimitWait` | 60000ms | 10000-300000 | 限流等待时间 |
| `permanentErrors` | [列表] | 自定义 | 永久错误列表 |

### 8.2 调整建议

| 场景 | 建议调整 |
|------|----------|
| 发送量小 | 减少重试次数，增加初始延迟 |
| 发送量大 | 增加重试次数，减少延迟 |
| Mailgun 经常限流 | 增加 rateLimitWait |
| 临时错误多 | 增加 maxRetries |

---

*自动重试系统设计完成：2026-03-14*
*设计者：CPO Sarah*

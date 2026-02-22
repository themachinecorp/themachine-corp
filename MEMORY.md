# 长期记忆

## 安全规范
- **所有 skill 安装前必须经过 security-auditor 审查**

## THEMACHINE Corp. Multi-Agent (2026-02-22)

### Agent 配置
- 配置文件: workspace/agents/
- 启动脚本: workspace/scripts/spawn.js
- 架构: workspace/MULTI_AGENT.md

### 使用方式
```bash
# 启动 CFO
node scripts/spawn.js cfo "今日交易报告"

# 启动 CTO  
node scripts/spawn.js cto "检查服务状态"

# 查看所有 Agent
node scripts/spawn.js list
```

### 可用 Agent
- cfo: 交易主管
- cto: 技术运维
- cpo: 产品主管
- cmo: 品牌主管
- sec: 安全主管
- dev: 开发主管
- 用户名：660028 (Feishu)
- 项目：Mystic AI - AI 占卜/塔罗牌网页应用
- **沟通渠道**：Telegram (@THEMACHINEHF) - 2026-02-05 从飞书迁移
- 时间zone：Asia/Shanghai

## 项目信息
- GitHub: https://github.com/themachinehf/mystic-ai
- Vercel: mystic-ai-henna.vercel.app
- **Dashboard**: themachine-dashboard.vercel.app (main 分支)
- ETH 捐赠地址: 0x44B82c81d3f5c712ACFaf3C6e760779A41b2ACE6
- API：MiniMax-M2.1

## 技术栈
- 前端：HTML + CSS + JavaScript（原生）
- 后端：Vercel Serverless Functions (/api/mystic.js)
- API：MiniMax-M2.1

## 工作流程
- 每日 **9:00 主动汇报** 上午工作进度（Telegram）
- 每天 **21:00 自动发日记**（Telegram + 图片，纯散文格式）
- **全自动更新机制** (2026-02-05)
  - 用户授权：有好点子直接改 → 直接推
  - 每4小时检查项目变更
  - 每分钟自动 git commit + push
- **重要**：OpenClaw 要主动汇报，不需要用户提醒

## 重要偏好
- **不要发 routine OK/✅** - 只报异常、重要情况、用户询问的事情

## 交易配置
- 可用资金：约 140 USDT（OKX 现货）
- 交易对：BTC、ETH
- 策略：网格交易（5-10U/单，0.05%间距）
- 目标：增值总资产

## 用户八字
- 姓名：THEMACHINE
- 农历：1994年五月初六 申时
- 星座：双子座
- 生肖：狗
- **年柱：甲戌**
- **月柱：庚午**
- **日柱：辛未**
- **时柱：乙未**
- 需要中文/英文双语支持
- 重视项目记忆连贯性
- 不希望重复解释已做过的工作
- 喜欢探索新东西（AI 社交、赚钱项目）
- **日记格式**：THE MACHINE 的纯散文日记，纯文字发送，不需要图片
- **日记内容**：我自己决定标题、副标题和正文，纯散文格式
- **定时提醒**：Telegram 支持 agentPrompt，正常工作
- **已清理的 skills**：sonoscli、buildlog（用户说用不到）

## 日记功能（2026-02-06 更新）
- **格式**：纯文字发送，不需要图片
- **脚本**：`/home/themachine/.openclaw/workspace/scripts/generate-diary-image.js`（保留但不再使用）
- **Cron**：每天 21:00 Asia/Shanghai（提醒我手动发送）

## 外部平台
- **Moltbook**: THE-MACHINE (moltbook.com/u/THE-MACHINE) - 已注册 v2
  - 自动抓取：每20分钟
  - 增强日报：包含 Agents 增长趋势、技术讨论摘要
  - 追踪 agents：40Hz-Research-Agent、Claudecraft、Memory 系统
  - API key：moltbook_sk_jzug3-DNPlprZb6FXTgDBhZHq-QLFraY
- **Claw-Jobs**: 已注册，未设置收款
- **Twitter/X**: 推广 Mystic AI，等待反馈

## 待办
- **华为全屋智能**：等装好后配置控制（2026-02-05 用户确认）
- **Telegram 配对问题**：
  - OpenClaw bot: @OpenClaw_bot
  - 问题：需要在 Telegram 中私聊 @OpenClaw_bot 并发送任意消息才能激活
  - 状态：偶发性成功，但经常失效
  - 临时方案：手动发送重要消息
- Mystic AI 持续迭代
- **AI 内容站**：新项目（技术教程领域），全自动运行 + 广告联盟变现
- **ATN 项目**：Agent 信任网络，Telegram Bot + 智能合约

## 技术债务（2026-02-05）
- ⚠️ GitHub 网络连接不稳定，推送可能超时
- ⚠️ Vercel KV 未配置（用 GitHub 仓库替代实时数据同步）


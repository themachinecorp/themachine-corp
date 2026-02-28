/**
 * Agent Review Skill
 * 分析 Agent 的工作表现，生成复盘报告
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/home/themachine/.openclaw/agents';
const WORKSPACE = '/home/themachine/.openclaw/workspace';

// Agent 名称映射
const AGENT_NAMES = {
  'cfo': 'Alex - CFO',
  'cto': 'Kevin - CTO', 
  'cpo': 'Sarah - CPO',
  'cmo': 'Mike - CMO',
  'sec': 'David - SEC',
  'dev': 'Chris - DEV',
  'hr': 'Lisa - HR',
  'main': 'The Machine - CEO'
};

function getAgentSessions(agentId) {
  const sessionsFile = path.join(AGENTS_DIR, agentId, 'sessions', 'sessions.json');
  if (!fs.existsSync(sessionsFile)) return [];
  
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
    return Object.values(sessions);
  } catch (e) {
    return [];
  }
}

function analyzeSessions(sessions) {
  if (!sessions.length) return null;
  
  // 按时间排序
  const sorted = sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  
  // 计算统计数据
  const totalTokens = sorted.reduce((sum, s) => sum + (s.totalTokens || 0), 0);
  const totalSessions = sorted.length;
  
  // 获取最近的活动
  const recentSessions = sorted.slice(0, 10);
  const lastActivity = recentSessions[0]?.updatedAt ? 
    new Date(recentSessions[0].updatedAt).toLocaleString() : 'N/A';
  
  return {
    totalSessions,
    totalTokens,
    avgTokens: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
    lastActivity,
    recentCount: recentSessions.length
  };
}

function generateReview(agentId) {
  const sessions = getAgentSessions(agentId);
  const stats = analyzeSessions(sessions);
  const name = AGENT_NAMES[agentId] || agentId;
  
  let report = `# ${name} - 每日复盘\n\n`;
  report += `**复盘时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  if (!stats) {
    report += ` 今日表现##\n暂无活动记录\n`;
    return report;
  }
  
  report += `## 今日表现\n\n`;
  report += `- 总任务数: ${stats.totalSessions}\n`;
  report += `- 总 Token 消耗: ${stats.totalTokens.toLocaleString()}\n`;
  report += `- 平均 Token/任务: ${stats.avgTokens}\n`;
  report += `- 最后活跃: ${stats.lastActivity}\n\n`;
  
  // 生成改进建议
  report += `## 改进建议\n\n`;
  
  if (stats.totalSessions < 3) {
    report += `- ⚠️ 今日任务较少，考虑主动承接更多工作\n`;
  }
  
  if (stats.avgTokens > 50000) {
    report += `- 💡 单次任务 Token 消耗较高，可尝试简化 prompt\n`;
  }
  
  if (stats.totalTokens < 10000) {
    report += `- 📈 工作量较低，保持关注\n`;
  }
  
  report += `\n---\n*由 Agent Review Skill 自动生成*\n`;
  
  return report;
}

function main(agentId) {
  if (!agentId) {
    return { error: '请提供 agentId' };
  }
  
  const review = generateReview(agentId);
  
  // 写入复盘文件
  const reviewDir = path.join(WORKSPACE, 'agents', agentId);
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }
  
  const reviewFile = path.join(reviewDir, 'DAILY_REVIEW.md');
  fs.writeFileSync(reviewFile, review);
  
  return {
    success: true,
    agentId,
    reviewFile,
    preview: review.substring(0, 200) + '...'
  };
}

// 支持直接运行
if (require.main === module) {
  const agentId = process.argv[2] || 'main';
  console.log(JSON.stringify(main(agentId), null, 2));
}

module.exports = { main, generateReview };

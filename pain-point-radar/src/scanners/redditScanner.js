import axios from 'axios';
import { createPainPoint } from '../models/painPoint.js';
import { SourceType } from '../models/painPoint.js';

/**
 * Reddit 热帖扫描 - 使用 prerender API 绕过限制
 */
export async function scanReddit(subreddits = ['MachineLearning', 'ArtificialIntelligence', 'LocalLLaMA'], limit = 15) {
  console.log('🔍 扫描 Reddit...');
  
  const allPosts = [];
  
  for (const sub of subreddits) {
    try {
      // 使用 Reddit 的旧版 API (json)
      const response = await axios.get(
        `https://old.reddit.com/r/${sub}/hot.json?limit=${limit}`,
        {
          headers: { 
            'User-Agent': 'PainPointRadar/1.0'
          },
          timeout: 15000
        }
      );
      
      const posts = response.data.data.children
        .map(c => c.data)
        .filter(p => p.score > 10);
      
      allPosts.push(...posts);
    } catch (error) {
      console.warn(`⚠️ r/${sub} 扫描失败:`, error.message);
    }
  }
  
  // 按热度排序
  allPosts.sort((a, b) => b.score - a.score);
  
  const painPoints = allPosts.slice(0, limit).map(post => {
    const isQuestion = post.is_self && (/\?|help|advice|opinion|best|how to/i.test(post.title));
    
    return createPainPoint({
      conclusion: isQuestion
        ? `[问题] ${post.title.substring(0, 100)}`
        : `[讨论] ${post.title.substring(0, 100)}`,
      evidenceUrl: `https://reddit.com${post.permalink}`,
      source: SourceType.REDDIT,
      nextAction: isQuestion ? '评估痛点价值' : '收集社区反馈'
    });
  });
  
  console.log(`✅ Reddit 扫描完成: ${painPoints.length} 条`);
  return painPoints;
}

import axios from 'axios';
import { createPainPoint } from '../models/painPoint.js';
import { SourceType } from '../models/painPoint.js';

const HN_API = 'https://hacker-news.firebaseio.com/v0';

/**
 * 获取 HN Top Stories
 */
async function getTopStories(limit = 30) {
  const response = await axios.get(`${HN_API}/topstories.json`);
  return response.data.slice(0, limit);
}

/**
 * 获取单个故事详情
 */
async function getStoryDetails(id) {
  const response = await axios.get(`${HN_API}/item/${id}.json`);
  return response.data;
}

/**
 * 扫描 HN Trending
 */
export async function scanHN(limit = 20) {
  console.log('🔍 扫描 Hacker News...');
  
  try {
    const storyIds = await getTopStories(limit);
    const stories = await Promise.all(
      storyIds.map(id => getStoryDetails(id))
    );
    
    // 过滤有实际内容的讨论
    const validStories = stories.filter(s => 
      s && s.title && s.score > 10 && s.descendants > 5
    );
    
    const painPoints = validStories.map(story => {
      // 从标题推断痛点
      const title = story.title;
      const isPainPoint = /\?|problem|issue|help|stuck|broken|bug|fail|difficult|hard|complex/i.test(title);
      
      return createPainPoint({
        conclusion: isPainPoint 
          ? title 
          : `HN 讨论: ${title}`,
        evidenceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: SourceType.HN,
        nextAction: isPainPoint ? '验证需求' : '评估相关性'
      });
    });
    
    console.log(`✅ HN 扫描完成: ${painPoints.length} 条`);
    return painPoints;
  } catch (error) {
    console.error('❌ HN 扫描失败:', error.message);
    return [];
  }
}

// 测试
// scanHN().then(console.log);

import Parser from 'rss-parser';
import { createPainPoint } from '../models/painPoint.js';
import { SourceType } from '../models/painPoint.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

// AI 博客 RSS 列表
const AI_BLOGS = [
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  { name: 'DeepMind', url: 'https://deepmind.com/blog/feed/basic/' },
  { name: 'MIT News - AI', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2' },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
];

/**
 * 扫描 RSS 订阅源
 */
export async function scanRSS(blogs = AI_BLOGS, limitPerBlog = 5) {
  console.log('🔍 扫描 AI 博客 RSS...');
  
  const allPosts = [];
  
  for (const blog of blogs) {
    try {
      const feed = await parser.parseURL(blog.url);
      
      if (feed.items && feed.items.length > 0) {
        const posts = feed.items.slice(0, limitPerBlog).map(item => ({
          title: item.title,
          link: item.link || item.url,
          date: item.pubDate || item.isoDate,
          source: blog.name
        }));
        
        allPosts.push(...posts);
      }
    } catch (error) {
      console.warn(`⚠️ ${blog.name} 扫描失败:`, error.message);
    }
  }
  
  // 按日期排序
  allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const painPoints = allPosts.map(post => {
    const title = post.title || '';
    const isNew = /new|release|announce|introducing/i.test(title);
    
    return createPainPoint({
      conclusion: isNew
        ? `[新] ${post.source}: ${title}`
        : `[更新] ${post.source}: ${title}`,
      evidenceUrl: post.link,
      source: SourceType.RSS,
      nextAction: isNew ? '评估影响范围' : '关注技术趋势'
    });
  });
  
  console.log(`✅ RSS 扫描完成: ${painPoints.length} 条`);
  return painPoints;
}

// 测试
// scanRSS().then(console.log);

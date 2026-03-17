import axios from 'axios';
import { createPainPoint } from '../models/painPoint.js';
import { SourceType } from '../models/painPoint.js';

const GITHUB_API = 'https://api.github.com';

/**
 * 获取 GitHub Trending
 */
export async function scanGitHub(language = '', limit = 20) {
  console.log('🔍 扫描 GitHub Trending...');
  
  try {
    // 使用 GitHub Trending 的非官方 API
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const since = date.toISOString().split('T')[0];
    
    const url = language 
      ? `https://api.github.com/search/repositories?q=created:>${since}+language:${language}&sort=stars&order=desc`
      : `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc`;
    
    const response = await axios.get(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      timeout: 10000
    });
    
    const repos = response.data.items.slice(0, limit);
    
    const painPoints = repos.map(repo => {
      // 从仓库描述推断痛点
      const desc = repo.description || '';
      const isPainPoint = /tool|library|framework|解决方案|easy|simple|fast|automate/i.test(desc);
      
      return createPainPoint({
        conclusion: isPainPoint 
          ? `${repo.name}: ${desc || '无描述'}`
          : `热门项目: ${repo.name}`,
        evidenceUrl: repo.html_url,
        source: SourceType.GITHUB,
        nextAction: isPainPoint ? '评估技术实现' : '关注发展趋势'
      });
    });
    
    console.log(`✅ GitHub 扫描完成: ${painPoints.length} 条`);
    return painPoints;
  } catch (error) {
    console.error('❌ GitHub 扫描失败:', error.message);
    return [];
  }
}

// 测试
// scanGitHub().then(console.log);

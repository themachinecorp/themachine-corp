import { scanHN } from './hnScanner.js';
import { scanGitHub } from './githubScanner.js';
import { scanHuggingFace } from './hfScanner.js';
import { scanReddit } from './redditScanner.js';
import { scanRSS } from './rssScanner.js';

/**
 * 扫描所有数据源
 */
export async function scanAll(options = {}) {
  const { 
    hn = true, 
    github = true, 
    hf = true, 
    reddit = true, 
    rss = true,
    limit = 20 
  } = options;
  
  console.log('='.repeat(50));
  console.log('🎯 开始全量扫描...');
  console.log('='.repeat(50));
  
  const results = [];
  const errors = [];
  
  // 并行扫描所有数据源
  const promises = [];
  
  if (hn) promises.push(scanHN(limit).then(r => results.push(...r)).catch(e => errors.push({ source: 'HN', error: e.message })));
  if (github) promises.push(scanGitHub('', limit).then(r => results.push(...r)).catch(e => errors.push({ source: 'GitHub', error: e.message })));
  if (hf) promises.push(scanHuggingFace(limit).then(r => results.push(...r)).catch(e => errors.push({ source: 'HF', error: e.message })));
  if (reddit) promises.push(scanReddit(['MachineLearning', 'AI'], limit).then(r => results.push(...r)).catch(e => errors.push({ source: 'Reddit', error: e.message })));
  if (rss) promises.push(scanRSS(undefined, 5).then(r => results.push(...r)).catch(e => errors.push({ source: 'RSS', error: e.message })));
  
  await Promise.all(promises);
  
  console.log('='.repeat(50));
  console.log(`📊 扫描完成: 共 ${results.length} 条痛点`);
  
  if (errors.length > 0) {
    console.warn('⚠️ 扫描异常:');
    errors.forEach(e => console.warn(`  - ${e.source}: ${e.error}`));
  }
  
  return results;
}

export { scanHN, scanGitHub, scanHuggingFace, scanReddit, scanRSS };

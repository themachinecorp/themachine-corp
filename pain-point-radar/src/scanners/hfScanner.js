import axios from 'axios';
import { createPainPoint } from '../models/painPoint.js';
import { SourceType } from '../models/painPoint.js';

/**
 * HuggingFace Papers 扫描 - 使用 alternative API
 */
export async function scanHuggingFace(limit = 20) {
  console.log('🔍 扫描 HuggingFace Papers...');
  
  try {
    // 尝试 Papers with Code 的公开 API
    const response = await axios.get(
      'https://paperswithcode.com/api/v1/trending/',
      { 
        timeout: 15000,
        params: { 
          date: '2026-03-12',
          granularity: 'daily'
        }
      }
    );
    
    const papers = response.data.results?.slice(0, limit) || [];
    
    const painPoints = papers.map(paper => {
      const title = paper.title || '';
      const isSolution = /improve|enhance|better|faster|new|approach|method/i.test(title);
      
      return createPainPoint({
        conclusion: isSolution
          ? `[论文] ${title.substring(0, 100)}`
          : `[研究] ${title.substring(0, 100)}`,
        evidenceUrl: paper.url || `https://paperswithcode.com/paper/${paper.id}`,
        source: SourceType.HF,
        nextAction: isSolution ? '评估应用场景' : '关注研究进展'
      });
    });
    
    console.log(`✅ HuggingFace 扫描完成: ${painPoints.length} 条`);
    return painPoints;
  } catch (error) {
    // 如果 API 失败，返回空数组
    console.warn(`⚠️ HuggingFace 扫描失败:`, error.message);
    return [];
  }
}

#!/usr/bin/env node

import { scanAll } from '../src/scanners/index.js';
import { initDatabase, savePainPoint, closeDatabase } from '../src/storage/database.js';

async function main() {
  console.log('🎯 Pain Point Radar - Scanner\n');
  
  // 初始化数据库
  initDatabase();
  
  try {
    // 扫描所有数据源
    const painPoints = await scanAll({ limit: 30 });
    
    // 保存到数据库
    console.log('\n💾 保存到数据库...');
    for (const pp of painPoints) {
      savePainPoint(pp);
    }
    
    console.log(`\n✅ 完成! 共获取 ${painPoints.length} 条痛点`);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    closeDatabase();
  }
}

main();

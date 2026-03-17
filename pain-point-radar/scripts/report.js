#!/usr/bin/env node

import { initDatabase, closeDatabase } from '../src/storage/database.js';
import { generateDailyReport } from '../src/reporter/reporter.js';
import { writeFileSync } from 'fs';

async function main() {
  console.log('📝 生成每日报告\n');
  
  initDatabase();
  
  try {
    const report = generateDailyReport();
    
    // 保存到文件
    const today = new Date().toISOString().split('T')[0];
    const filename = `../reports/daily-${today}.md`;
    
    // 确保 reports 目录存在
    import('fs').then(fs => {
      const dir = fs.existsSync('./reports') ? null : fs.mkdirSync('./reports', { recursive: true });
    });
    
    writeFileSync(`./reports/daily-${today}.md`, report);
    
    console.log(`\n✅ 报告已保存到: reports/daily-${today}.md`);
    console.log('\n' + '='.repeat(50));
    console.log(report);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    closeDatabase();
  }
}

main();

import { scanAll } from '../scanners/index.js';
import { initDatabase, savePainPoint, getPainPointStats, closeDatabase } from '../storage/database.js';
import { generateDailyReport, generateJSONReport } from '../reporter/reporter.js';

/**
 * 主程序
 */
async function main() {
  console.log('🚀 Pain Point Radar 启动\n');
  
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
    console.log(`✅ 已保存 ${painPoints.length} 条痛点`);
    
    // 输出统计
    const stats = getPainPointStats();
    console.log('\n📊 统计:');
    console.log(`  - 总数: ${stats.total}`);
    console.log(`  - 按状态:`, stats.byStatus);
    console.log(`  - 按来源:`, stats.bySource);
    
    // 生成报告
    console.log('\n' + generateDailyReport());
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    closeDatabase();
  }
}

// 运行
main();

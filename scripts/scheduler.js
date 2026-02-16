#!/usr/bin/env node
/**
 * 定时调度器
 * - 每4小时检查项目变更并提交
 * - 每天自动代码优化
 */

import { execSync } from 'child_process';

const OPTIMIZE_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
const CHECK_INTERVAL = 4 * 60 * 60 * 1000;    // 4小时

async function runOptimizer() {
    try {
        console.log('🕐 定时优化任务启动...');
        execSync('node scripts/code-optimizer.js', { cwd: '/home/themachine/.openclaw/workspace' });
    } catch (e) {
        console.error('优化失败:', e.message);
    }
}

async function runChecker() {
    try {
        console.log('🕐 项目状态检查...');
        execSync('node scripts/auto-update-projects.js', { cwd: '/home/themachine/.openclaw/workspace' });
    } catch (e) {
        console.error('检查失败:', e.message);
    }
}

// 启动
console.log('📅 调度器已启动...');
console.log(`优化周期: ${OPTIMIZE_INTERVAL / 3600000}小时`);
console.log(`检查周期: ${CHECK_INTERVAL / 3600000}小时`);

// 主循环
let lastOptimize = Date.now();

setInterval(() => {
    const now = Date.now();
    
    // 优化检查
    if (now - lastOptimize > OPTIMIZE_INTERVAL) {
        runOptimizer();
        lastOptimize = now;
    }
    
    // 常规检查
    runChecker();
    
}, CHECK_INTERVAL);

// 立即运行一次
runChecker();

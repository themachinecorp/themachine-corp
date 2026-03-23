/**
 * OKX 交易策略 V2 - 优化版
 * 改进: 减少交易频率，设置止损，只做强信号
 */

const CONFIG = {
  // 交易参数
  maxPosition: 100,      // 最大持仓数量
  stopLoss: -50,         // 止损线 USDT
  minProfit: 5,         // 最小盈利 USDT
  
  // 信号过滤
  onlyStrong: true,     // 只做强信号
  ignoreHold: true,     // 忽略 hold
  
  // 冷却时间
  cooldownMs: 300000,   // 5分钟冷却
  
  // 资金管理
  maxPerTrade: 10,      // 单次最大交易 USDT
  
  // 风险管理
  maxDailyLoss: -30,    // 单日最大亏损
  tradingEnabled: true   // 交易开关
};

// 信号强度
const SIGNAL = {
  strong_buy: 5,
  buy: 3,
  hold: 0,
  sell: -3,
  strong_sell: -5
};

// 决策逻辑
function shouldTrade(signal, position, pnl) {
  // 检查交易开关
  if (!CONFIG.tradingEnabled) return { action: 'stop', reason: 'Trading disabled' };
  
  // 检查止损
  if (pnl < CONFIG.stopLoss) return { action: 'stop', reason: 'Stop loss triggered' };
  
  // 检查持仓上限
  if (position > CONFIG.maxPosition) return { action: 'wait', reason: 'Max position reached' };
  
  // 只做强信号
  if (CONFIG.onlyStrong && Math.abs(SIGNAL[signal]) < 4) {
    return { action: 'wait', reason: 'Signal too weak' };
  }
  
  // 忽略 hold
  if (CONFIG.ignoreHold && signal === 'hold') {
    return { action: 'wait', reason: 'Hold signal ignored' };
  }
  
  // 买入逻辑
  if (signal === 'strong_buy' || signal === 'buy') {
    return { action: 'buy', reason: `Signal: ${signal}` };
  }
  
  // 卖出逻辑
  if (signal === 'strong_sell' || signal === 'sell') {
    return { action: 'sell', reason: `Signal: ${signal}` };
  }
  
  return { action: 'wait', reason: 'No clear signal' };
}

module.exports = { CONFIG, SIGNAL, shouldTrade };

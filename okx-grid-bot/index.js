/**
 * OKX Multi-Strategy Trading Bot
 * 策略：网格 + EMA趋势 + RSI信号 + 动态仓位
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const TRADING_PAIRS = [
    { symbol: 'BTC/USDT', instId: 'BTC-USDT', baseOrderValue: 5, gridCount: 3, gridSpread: 0.001 },
    { symbol: 'ETH/USDT', instId: 'ETH-USDT', baseOrderValue: 5, gridCount: 3, gridSpread: 0.002 },
];

const CONFIG = {
    apiKey: '87f9c88b-111c-43ff-a08a-49fb3381e7f2',
    secretKey: 'CDDC78B4CB328C767A1A79CF35DDEAF7',
    passphrase: 'TheMachine8023!',
    checkInterval: 5000,
    testMode: false,
    
    // 策略参数
    emaPeriod: 26,           // EMA 周期
    emaTrendPeriod: 100,     // 长周期EMA判断趋势
    rsiPeriod: 14,           // RSI 周期
    rsiOversold: 30,        // RSI 超卖阈值
    rsiOverbought: 70,      // RSI 超买阈值
    volatilityPeriod: 20,     // 波动率计算周期
    minVolatility: 0.005,   // 最小波动率
    maxVolatility: 0.05,    // 最大波动率
};

// ============ 日志 ============
const LOG_FILE = path.join(__dirname, 'trades.log');
const PROFIT_FILE = path.join(__dirname, 'profit.json');
const INDICATOR_FILE = path.join(__dirname, 'indicators.json');

function writeLog(msg) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
}

function loadProfit() {
    try {
        if (fs.existsSync(PROFIT_FILE)) {
            return JSON.parse(fs.readFileSync(PROFIT_FILE, 'utf8'));
        }
    } catch(e) {}
    return { trades: [], totalProfit: 0, startTime: Date.now() };
}

function saveProfit(data) {
    fs.writeFileSync(PROFIT_FILE, JSON.stringify(data, null, 2));
}

function recordTrade(pair, side, amount, price, value, strategy) {
    const profit = loadProfit();
    profit.trades.push({
        pair, time: new Date().toISOString(), side, amount, price, value, strategy
    });
    profit.totalProfit += (side === 'sell' ? value : -value);
    saveProfit(profit);
    writeLog(`💰 ${pair} ${side} ${strategy} ${amount.toFixed(6)} @ ${price.toFixed(2)}, 累计: ${profit.totalProfit.toFixed(2)} USDT`);
}

// ============ Python API ============
function pythonRequest(method, instId, endpoint, body = {}) {
    return new Promise((resolve, reject) => {
        const bodyStr = Object.keys(body).length > 0 ? JSON.stringify(body) : '{}';
        
        const python = spawn('python3', ['-c', `
import sys
import json
import hmac
import base64
import time
import requests
from datetime import datetime, timezone

api_key = '${CONFIG.apiKey}'
secret_key = '${CONFIG.secretKey}'
passphrase = '${CONFIG.passphrase}'

timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
method = '${method}'
path = '${endpoint}'

body = ${bodyStr}
body_str = json.dumps(body) if body else ''

message = timestamp + method + path + body_str
signature = base64.b64encode(hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), digestmod='sha256').digest()).decode('utf-8')

headers = {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': api_key,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': passphrase
}

try:
    if method == 'GET':
        r = requests.get('https://www.okx.com' + path, headers=headers, proxies={'http': 'http://127.0.0.1:6789', 'https': 'http://127.0.0.1:6789'}, timeout=15)
    else:
        r = requests.post('https://www.okx.com' + path, headers=headers, json=body, proxies={'http': 'http://127.0.0.1:6789', 'https': 'http://127.0.0.1:6789'}, timeout=15)
    print(r.text)
except Exception as e:
    print(json.dumps({'error': str(e)}))
`]);

        let result = '';
        python.stdout.on('data', (data) => { result += data; });
        python.stderr.on('data', (data) => { console.error('Python error:', data.toString()); });
        python.on('close', (code) => {
            try {
                const json = JSON.parse(result);
                resolve(json);
            } catch(e) {
                reject(new Error(result));
            }
        });
    });
}

// ============ 指标计算 ============
class Indicator {
    constructor(symbol) {
        this.symbol = symbol;
        this.prices = [];
        this.maxPrices = 200;
    }
    
    addPrice(price) {
        this.prices.push(price);
        if (this.prices.length > this.maxPrices) {
            this.prices.shift();
        }
    }
    
    // 计算 EMA
    calcEMA(period) {
        if (this.prices.length < period) return null;
        const k = 2 / (period + 1);
        let ema = this.prices[0];
        for (let i = 1; i < this.prices.length; i++) {
            ema = this.prices[i] * k + ema * (1 - k);
        }
        return ema;
    }
    
    // 计算 RSI
    calcRSI(period = 14) {
        if (this.prices.length < period + 1) return null;
        
        let gains = 0, losses = 0;
        for (let i = this.prices.length - period; i < this.prices.length; i++) {
            const change = this.prices[i] - this.prices[i-1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    // 计算 ATR 波动率
    calcVolatility(period = 20) {
        if (this.prices.length < period) return CONFIG.minVolatility;
        
        let sum = 0;
        for (let i = this.prices.length - period; i < this.prices.length; i++) {
            sum += Math.abs(this.prices[i] - this.prices[i-1]) / this.prices[i-1];
        }
        const vol = sum / period;
        return Math.max(CONFIG.minVolatility, Math.min(CONFIG.maxVolatility, vol));
    }
    
    // 趋势判断：EMA多头/空头
    getTrend() {
        const emaFast = this.calcEMA(CONFIG.emaPeriod);
        const emaSlow = this.calcEMA(CONFIG.emaTrendPeriod);
        
        if (!emaFast || !emaSlow) return 'neutral';
        return emaFast > emaSlow ? 'up' : 'down';
    }
    
    // 综合信号
    getSignal() {
        const trend = this.getTrend();
        const rsi = this.calcRSI(CONFIG.rsiPeriod);
        const volatility = this.calcVolatility(CONFIG.volatilityPeriod);
        
        let signal = 'hold';
        let reason = [];
        
        // 趋势过滤
        if (trend === 'up') reason.push('EMA↑');
        else if (trend === 'down') reason.push('EMA↓');
        
        // RSI 信号
        if (rsi !== null) {
            if (rsi < CONFIG.rsiOversold) {
                signal = 'buy';
                reason.push(`RSI超卖${rsi.toFixed(0)}`);
            } else if (rsi > CONFIG.rsiOverbought) {
                signal = 'sell';
                reason.push(`RSI超买${rsi.toFixed(0)}`);
            }
        }
        
        // 趋势+RSI共振
        if (signal === 'buy' && trend === 'up') {
            signal = 'strong_buy';
            reason.push('共振');
        }
        if (signal === 'sell' && trend === 'down') {
            signal = 'strong_sell';
            reason.push('共振');
        }
        
        return { signal, reason: reason.join('+'), rsi, trend, volatility };
    }
    
    save() {
        const data = {
            symbol: this.symbol,
            lastPrice: this.prices[this.prices.length - 1],
            trend: this.getTrend(),
            ...this.getSignal(),
            updated: new Date().toISOString()
        };
        fs.writeFileSync(INDICATOR_FILE, JSON.stringify(data, null, 2));
    }
}

// ============ 行情 ============
async function getTicker(instId) {
    try {
        const res = await pythonRequest('GET', instId, `/api/v5/market/ticker?instId=${instId}`);
        if (res.code === '0' && res.data && res.data[0]) {
            return {
                last: parseFloat(res.data[0].last),
                buy: parseFloat(res.data[0].bidPx),
                sell: parseFloat(res.data[0].askPx)
            };
        }
    } catch (e) {
        console.error('获取价格失败:', e.message);
    }
    return null;
}

// ============ 下单 ============
async function placeOrder(instId, side, px, sz, strategy = 'grid') {
    const body = {
        instId,
        tdMode: 'cash',
        side,
        ordType: 'market',
        sz: sz.toString()
    };
    
    writeLog(`📥${side === 'buy' ? '市价买入' : '市价卖出'} ${sz} ${strategy}`);
    
    if (CONFIG.testMode) {
        writeLog(`   [模拟] ${side === 'buy' ? '买入' : '卖出'} ${sz}`);
        return { success: true };
    }
    
    try {
        const res = await pythonRequest('POST', instId, '/api/v5/trade/order', body);
        if (res.code === '0' && res.data && res.data[0] && res.data[0].ordId) {
            writeLog(`   ✅ 成功! ID: ${res.data[0].ordId}`);
            return { success: true, orderId: res.data[0].ordId };
        } else {
            writeLog(`   ❌ 失败: ${res.data ? res.data[0].sMsg : res.msg}`);
            return { success: false };
        }
    } catch (e) {
        writeLog(`   ❌ 错误: ${e.message}`);
        return { success: false };
    }
}

// ============ 多策略交易机器人 ============
class MultiStrategyBot {
    constructor(pairConfig) {
        this.symbol = pairConfig.symbol;
        this.instId = pairConfig.instId;
        this.baseOrderValue = pairConfig.baseOrderValue;
        this.gridCount = pairConfig.gridCount;
        this.gridSpread = pairConfig.gridSpread;
        
        this.grids = [];
        this.running = false;
        this.lastMidPrice = 0;
        this.indicator = new Indicator(this.symbol);
        
        // 策略状态
        this.lastSignal = 'hold';
        this.position = 0;  // 1=持多仓, -1=持空仓, 0=空仓
    }
    
    getPrecision() {
        if (this.symbol.includes('BTC')) return 2;
        if (this.symbol.includes('ETH')) return 2;
        if (this.symbol.includes('SOL')) return 3;
        return 4;
    }
    
    // 初始化网格
    async initGrids() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return false;
        
        const midPrice = ticker.last;
        const buyPrice = ticker.buy;
        const sellPrice = ticker.sell;
        this.lastMidPrice = midPrice;
        
        this.indicator.addPrice(midPrice);
        
        this.grids = [];
        const spread = 0.005;
        
        for (let i = 1; i <= this.gridCount / 2; i++) {
            const buyGridPrice = buyPrice * (1 - spread * i);
            this.grids.push({
                id: i,
                side: 'buy',
                price: parseFloat(buyGridPrice.toFixed(this.getPrecision())),
                filled: false
            });
            
            const sellGridPrice = sellPrice * (1 + spread * i);
            this.grids.push({
                id: this.gridCount / 2 + i,
                side: 'sell',
                price: parseFloat(sellGridPrice.toFixed(this.getPrecision())),
                filled: false
            });
        }
        
        writeLog(`[${this.symbol}] 初始化，现价: ${midPrice.toFixed(this.getPrecision())}`);
        const buyGrids = this.grids.filter(g => g.side === 'buy');
        const sellGrids = this.grids.filter(g => g.side === 'sell');
        writeLog(`[${this.symbol}] 买单: ${buyGrids.map(g => g.price.toFixed(this.getPrecision())).join(', ')}`);
        writeLog(`[${this.symbol}] 卖单: ${sellGrids.map(g => g.price.toFixed(this.getPrecision())).join(', ')}`);
        return true;
    }
    
    // 检查是否需要重置网格
    async checkAndResetGrids() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const currentPrice = ticker.last;
        const priceChange = Math.abs(currentPrice - this.lastMidPrice) / this.lastMidPrice;
        
        if (priceChange > 0.3) {
            writeLog(`[${this.symbol}] 价格变动 ${(priceChange*100).toFixed(1)}%，重置网格...`);
            this.grids = [];
            await this.initGrids();
        }
    }
    
    // 获取动态仓位
    getDynamicSize(signal) {
        const volatility = this.indicator.calcVolatility(CONFIG.volatilityPeriod);
        let multiplier = 1;
        
        // 波动率高时减少仓位
        if (volatility > CONFIG.maxVolatility * 0.8) {
            multiplier = 0.5;
        } else if (volatility > CONFIG.maxVolatility * 0.6) {
            multiplier = 0.75;
        }
        
        // 强信号增加仓位
        if (signal === 'strong_buy' || signal === 'strong_sell') {
            multiplier *= 1.5;
        }
        
        return this.baseOrderValue * multiplier;
    }
    
    // 核心交易逻辑
    async tick() {
        if (!this.running) return;
        
        await this.checkAndResetGrids();
        
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const price = ticker.last;
        this.indicator.addPrice(price);
        
        // 获取信号
        const signalData = this.indicator.getSignal();
        const { signal, reason, rsi, trend, volatility } = signalData;
        
        // 保存指标数据
        this.indicator.save();
        
        // 更新信号
        const signalChanged = signal !== this.lastSignal;
        this.lastSignal = signal;
        
        if (signalChanged) {
            writeLog(`[${this.symbol}] 📊 信号: ${signal} ${reason} | 价格: ${price.toFixed(2)} | 波动: ${(volatility*100).toFixed(1)}%`);
        }
        
        // ============ 趋势/RSI 策略 ============
        // 强买信号且空仓时买入
        if ((signal === 'strong_buy' || signal === 'buy') && this.position <= 0) {
            const sz = this.getDynamicSize(signal) / price;
            const result = await placeOrder(this.instId, 'buy', price, sz, signal);
            if (result.success) {
                recordTrade(this.symbol, 'buy', sz, price, this.baseOrderValue, signal);
                this.position = 1;
            }
        }
        
        // 强卖信号且持多仓时卖出
        if ((signal === 'strong_sell' || signal === 'sell') && this.position >= 0) {
            const sz = this.getDynamicSize(signal) / price;
            const result = await placeOrder(this.instId, 'sell', price, sz, signal);
            if (result.success) {
                recordTrade(this.symbol, 'sell', sz, price, this.baseOrderValue, signal);
                this.position = -1;
            }
        }
        
        // ============ 网格策略 ============
        for (const grid of this.grids) {
            // 买单成交且价格回升时卖出
            if (grid.side === 'buy' && !grid.filled && price <= grid.price) {
                // 只有在非下跌趋势时才执行网格买入
                if (trend !== 'down' || signal === 'strong_buy') {
                    const sz = this.baseOrderValue / grid.price;
                    const result = await placeOrder(this.instId, 'buy', grid.price, sz, 'grid');
                    if (result.success) {
                        recordTrade(this.symbol, 'buy', sz, grid.price, this.baseOrderValue, 'grid');
                        grid.filled = true;
                    }
                }
            }
            
            // 卖单成交且价格回跌时买回
            if (grid.side === 'sell' && grid.filled && price >= grid.price) {
                // 只有在非上涨趋势时才执行网格卖出
                if (trend !== 'up' || signal === 'strong_sell') {
                    const sz = this.baseOrderValue / grid.price;
                    const result = await placeOrder(this.instId, 'sell', grid.price, sz, 'grid');
                    if (result.success) {
                        recordTrade(this.symbol, 'sell', sz, grid.price, this.baseOrderValue, 'grid');
                        grid.filled = false;
                    }
                }
            }
        }
        
        const filled = this.grids.filter(g => g.filled).length;
        process.stdout.write(`\r[${this.symbol}] ${price.toFixed(2)} | ${signal} | ${rsi ? rsi.toFixed(0) : '--'} | ${filled}/${this.gridCount}格 | P:${this.position > 0 ? '多' : this.position < 0 ? '空' : '空'}`);
    }
    
    start() {
        this.initGrids().then(ok => {
            if (ok) {
                writeLog(`========== ${this.symbol} 多策略机器人启动 ==========`);
                writeLog(`[${this.symbol}] EMA周期: ${CONFIG.emaPeriod}/${CONFIG.emaTrendPeriod}, RSI: ${CONFIG.rsiPeriod}, 超卖: ${CONFIG.rsiOversold}, 超买: ${CONFIG.rsiOverbought}`);
                this.running = true;
                setInterval(() => this.tick(), CONFIG.checkInterval);
            }
        });
    }
}

// ============ 启动 ============
writeLog('========== OKX Multi-Strategy Bot 启动 ==========');
writeLog(`策略: 网格 + EMA趋势 + RSI信号 + 动态仓位`);

TRADING_PAIRS.forEach(pair => {
    const bot = new MultiStrategyBot(pair);
    bot.start();
});

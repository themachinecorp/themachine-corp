/**
 * OKX Grid Trading Bot - Multi Pair Version
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
// 使用市价单策略 - 避免价格限制问题
const TRADING_PAIRS = [
    { symbol: 'BTC/USDT', instId: 'BTC-USDT', baseOrderValue: 2, gridCount: 5, gridSpread: 0.002 },
    { symbol: 'ETH/USDT', instId: 'ETH-USDT', baseOrderValue: 2, gridCount: 5, gridSpread: 0.003 },
    { symbol: 'SOL/USDT', instId: 'SOL-USDT', baseOrderValue: 2, gridCount: 5, gridSpread: 0.005 },
    { symbol: 'DOGE/USDT', instId: 'DOGE-USDT', baseOrderValue: 5, gridCount: 5, gridSpread: 0.005 },
    { symbol: 'XRP/USDT', instId: 'XRP-USDT', baseOrderValue: 5, gridCount: 5, gridSpread: 0.005 },
];

const CONFIG = {
    apiKey: '87f9c88b-111c-43ff-a08a-49fb3381e7f2',
    secretKey: 'CDDC78B4CB328C767A1A79CF35DDEAF7',
    passphrase: 'TheMachine8023!',
    checkInterval: 5000,
    testMode: false
};

// ============ 日志 ============
const LOG_FILE = path.join(__dirname, 'trades.log');
const PROFIT_FILE = path.join(__dirname, 'profit.json');

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

function recordTrade(pair, side, amount, price, value) {
    const profit = loadProfit();
    profit.trades.push({
        pair,
        time: new Date().toISOString(),
        side,
        amount,
        price,
        value
    });
    saveProfit(profit);
    writeLog(`💰 ${pair} ${side} ${amount.toFixed(6)} @ ${price.toFixed(2)}, 累计: ${profit.totalProfit.toFixed(2)} USDT`);
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
async function placeOrder(instId, side, px, sz) {
    // 使用市价单 - 避免价格限制
    const body = {
        instId,
        tdMode: 'cash',
        side,
        ordType: 'market',  // 市价单
        sz: sz.toString()
    };
    
    writeLog(`📥${side === 'buy' ? '市价买入' : '市价卖出'} ${sz} @ 市价`);
    
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

// ============ 单币种网格 ============
class GridBot {
    constructor(pairConfig) {
        this.symbol = pairConfig.symbol;
        this.instId = pairConfig.instId;
        this.baseOrderValue = pairConfig.baseOrderValue;
        this.gridCount = pairConfig.gridCount;
        this.gridSpread = pairConfig.gridSpread;
        this.grids = [];
        this.running = false;
        this.lastMidPrice = 0;
    }
    
    async initGrids() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return false;
        
        const midPrice = ticker.last;
        const buyPrice = ticker.buy;
        const sellPrice = ticker.sell;
        this.lastMidPrice = midPrice;
        
        this.grids = [];
        
        // Use MUCH tighter spreads to stay within OKX limits (typically 1% from current)
        const spread = 0.005; // 0.5% between each grid
        
        // Calculate prices as percentage of current price
        for (let i = 1; i <= this.gridCount / 2; i++) {
            // Buy grids: slightly below current buy price
            const buyGridPrice = buyPrice * (1 - spread * i);
            this.grids.push({
                id: i,
                side: 'buy',
                price: parseFloat(buyGridPrice.toFixed(this.getPrecision())),
                filled: false
            });
            
            // Sell grids: slightly above current sell price  
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
    
    getPrecision() {
        // Return appropriate decimal places based on symbol
        if (this.symbol.includes('BTC')) return 2;
        if (this.symbol.includes('ETH')) return 2;
        if (this.symbol.includes('SOL')) return 3;
        if (this.symbol.includes('XRP')) return 4;
        if (this.symbol.includes('DOGE')) return 5;
        return 4;
    }
    
    async checkAndResetGrids() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const currentPrice = ticker.last;
        const priceChange = Math.abs(currentPrice - this.lastMidPrice) / this.lastMidPrice;
        
        // If price moved more than 30%, reset grids
        if (priceChange > 0.3) {
            writeLog(`[${this.symbol}] 价格变动 ${(priceChange*100).toFixed(1)}%，重置网格...`);
            this.grids = [];
            await this.initGrids();
        }
    }
    
    async tick() {
        if (!this.running) return;
        
        // Check if grids need reset due to price movement
        await this.checkAndResetGrids();
        
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const price = ticker.last;
        
        for (const grid of this.grids) {
            // Buy grids: trigger when price drops to or below grid price
            if (grid.side === 'buy' && !grid.filled && price <= grid.price) {
                const sz = this.baseOrderValue / grid.price;
                const result = await placeOrder(this.instId, 'buy', grid.price, sz);
                if (result.success) {
                    recordTrade(this.symbol, 'buy', sz, grid.price, this.baseOrderValue);
                    grid.filled = true;
                }
            }
            
            // Sell grids: trigger when price rises to or above grid price
            if (grid.side === 'sell' && grid.filled && price >= grid.price) {
                const sz = this.baseOrderValue / grid.price;
                const result = await placeOrder(this.instId, 'sell', grid.price, sz);
                if (result.success) {
                    recordTrade(this.symbol, 'sell', sz, grid.price, this.baseOrderValue);
                    grid.filled = false;
                }
            }
        }
        
        const filled = this.grids.filter(g => g.filled).length;
        process.stdout.write(`\r[${this.symbol}] ${price.toFixed(2)} | ${filled}/${this.gridCount}格`);
    }
    
    start() {
        this.initGrids().then(ok => {
            if (ok) {
                writeLog(`========== ${this.symbol} 网格启动 ==========`);
                this.running = true;
                setInterval(() => this.tick(), CONFIG.checkInterval);
            }
        });
    }
}

// ============ 主程序 ============
writeLog('========== 多币种网格交易启动 ==========');
writeLog(`交易对: ${TRADING_PAIRS.map(p => p.symbol).join(', ')}`);
writeLog(`测试模式: ${CONFIG.testMode ? '是' : '否'}`);
writeLog('=========================================');

// 启动每个交易对
TRADING_PAIRS.forEach(pairConfig => {
    const bot = new GridBot(pairConfig);
    bot.start();
});

process.on('SIGINT', () => {
    writeLog('机器人已停止');
    process.exit();
});

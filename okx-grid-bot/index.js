/**
 * OKX Grid Trading Bot - Multi Pair Version
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const TRADING_PAIRS = [
    { symbol: 'BTC/USDT', instId: 'BTC-USDT', baseOrderValue: 2, gridCount: 10, gridSpread: 0.005 },
    { symbol: 'ETH/USDT', instId: 'ETH-USDT', baseOrderValue: 2, gridCount: 10, gridSpread: 0.008 },
    { symbol: 'SOL/USDT', instId: 'SOL-USDT', baseOrderValue: 2, gridCount: 15, gridSpread: 0.025 },
    { symbol: 'DOGE/USDT', instId: 'DOGE-USDT', baseOrderValue: 5, gridCount: 10, gridSpread: 0.03 },
    { symbol: 'XRP/USDT', instId: 'XRP-USDT', baseOrderValue: 5, gridCount: 10, gridSpread: 0.02 },
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
    const body = {
        instId,
        tdMode: 'cash',
        side,
        ordType: 'limit',
        px: px.toString(),
        sz: sz.toString()
    };
    
    writeLog(`📥${side === 'buy' ? '买入' : '卖出'} ${sz} @ ${px}`);
    
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
    }
    
    async initGrids() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return false;
        
        const midPrice = ticker.last;
        
        this.grids = [];
        for (let i = 0; i < this.gridCount; i++) {
            const price = midPrice * (1 - this.gridSpread * (this.gridCount / 2 - i));
            this.grids.push({
                id: i,
                price: price,
                filled: false
            });
        }
        
        writeLog(`[${this.symbol}] 初始化，价格: ${midPrice.toFixed(2)}，范围: ${this.grids[0].price.toFixed(2)} - ${this.grids[this.grids.length - 1].price.toFixed(2)}`);
        return true;
    }
    
    async tick() {
        if (!this.running) return;
        
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const price = ticker.last;
        
        for (const grid of this.grids) {
            if (!grid.filled && price <= grid.price * (1 - this.gridSpread / 2)) {
                const sz = this.baseOrderValue / grid.price;
                const result = await placeOrder(this.instId, 'buy', grid.price, sz);
                if (result.success) {
                    recordTrade(this.symbol, 'buy', sz, grid.price, this.baseOrderValue);
                    grid.filled = true;
                }
            }
            
            if (grid.filled && price >= grid.price * (1 + this.gridSpread / 2)) {
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

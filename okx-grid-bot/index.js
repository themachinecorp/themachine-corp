/**
 * OKX Grid Trading Bot with Python for API calls
 */

const { spawn } = require('child_process');
const crypto = require('crypto');
const https = require('https');

// ============ 配置 ============
const CONFIG = {
    apiKey: '87f9c88b-111c-43ff-a08a-49fb3381e7f2',
    secretKey: 'CDDC78B4CB328C767A1A79CF35DDEAF7',
    passphrase: 'TheMachine8023!',
    
    symbol: 'BTC/USDT',
    gridCount: 10,
    gridSpread: 0.001,
    orderRatio: 0.1,
    minOrderAmount: 1,
    baseOrderValue: 1,   // 1 USDT 每格
    checkInterval: 3000,
    testMode: false
};

const instId = 'BTC-USDT';

// ============ Python API 调用 ============
function pythonRequest(method, endpoint, body = {}) {
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

// ============ 行情获取 ============
async function getTicker() {
    try {
        const res = await pythonRequest('GET', `/api/v5/market/ticker?instId=${instId}`);
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
async function placeOrder(side, px, sz) {
    const body = {
        instId,
        tdMode: 'cash',
        side,
        ordType: 'limit',
        px: px.toString(),
        sz: sz.toString()
    };
    
    console.log(`📥${side === 'buy' ? '买入' : '卖出'} ${sz} @ ${px}`);
    
    if (CONFIG.testMode) {
        console.log(`   [模拟] ${side === 'buy' ? '买入' : '卖出'} ${sz} BTC`);
        return { success: true };
    }
    
    try {
        const res = await pythonRequest('POST', '/api/v5/trade/order', body);
        if (res.code === '0' && res.data && res.data[0] && res.data[0].ordId) {
            console.log(`   ✅ 成功! 订单ID: ${res.data[0].ordId}`);
            return { success: true, orderId: res.data[0].ordId };
        } else {
            console.log(`   ❌ 失败: ${res.data ? res.data[0].sMsg : res.msg}`);
            return { success: false };
        }
    } catch (e) {
        console.log(`   ❌ 错误: ${e.message}`);
        return { success: false };
    }
}

// ============ 网格策略 ============
class GridBot {
    constructor() {
        this.grids = [];
        this.running = false;
    }
    
    async initGrids() {
        const ticker = await getTicker();
        if (!ticker) return false;
        
        const midPrice = ticker.last;
        const spread = this.gridSpread || CONFIG.gridSpread;
        
        this.grids = [];
        for (let i = 0; i < CONFIG.gridCount; i++) {
            const price = midPrice * (1 - spread * (CONFIG.gridCount / 2 - i));
            this.grids.push({
                id: i,
                price: price,
                filled: false
            });
        }
        
        console.log(`网格初始化，当前价格: ${midPrice}`);
        console.log(`网格范围: ${this.grids[0].price.toFixed(2)} - ${this.grids[this.grids.length - 1].price.toFixed(2)}`);
        return true;
    }
    
    async start() {
        console.log('========== 网格交易机器人启动 ==========');
        console.log(`交易对: ${CONFIG.symbol}`);
        console.log(`网格数量: ${CONFIG.gridCount}`);
        console.log(`网格间距: ${CONFIG.gridSpread * 100}%`);
        console.log(`测试模式: ${CONFIG.testMode ? '是' : '否'}`);
        console.log('=========================================');
        
        const initOk = await this.initGrids();
        if (!initOk) {
            console.log('初始化失败');
            return;
        }
        
        this.running = true;
        setInterval(() => this.tick(), CONFIG.checkInterval);
    }
    
    async tick() {
        if (!this.running) return;
        
        const ticker = await getTicker();
        if (!ticker) return;
        
        const price = ticker.last;
        
        for (const grid of this.grids) {
            // 买入条件
            if (!grid.filled && price <= grid.price * (1 - CONFIG.gridSpread / 2)) {
                const sz = CONFIG.baseOrderValue / grid.price;
                await placeOrder('buy', grid.price, sz);
                grid.filled = true;
            }
            
            // 卖出条件
            if (grid.filled && price >= grid.price * (1 + CONFIG.gridSpread / 2)) {
                const sz = CONFIG.baseOrderValue / grid.price;
                await placeOrder('sell', grid.price, sz);
                grid.filled = false;
            }
        }
        
        const filled = this.grids.filter(g => g.filled).length;
        process.stdout.write(`\r价格: ${price.toFixed(2)} | 持仓: ${filled}/${this.grids.length}格`);
    }
    
    stop() {
        this.running = false;
    }
}

const bot = new GridBot();
bot.start();

process.on('SIGINT', () => {
    bot.stop();
    console.log('\n机器人已停止');
    process.exit();
});

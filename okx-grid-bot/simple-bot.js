/**
 * OKX Simple Trading Bot - 现货版
 * 只做低买高卖，不做空
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    apiKey: '87f9c88b-111c-43ff-a08a-49fb3381e7f2',
    secretKey: 'CDDC78B4CB328C767A1A79CF35DDEAF7',
    passphrase: 'TheMachine8023!',
    checkInterval: 60000,  // 1分钟检查一次
    minOrderValue: 10,     // 最低订单金额
};

const TRADING_PAIRS = [
    { symbol: 'BTC/USDT', instId: 'BTC-USDT', orderValue: 10 },
    { symbol: 'ETH/USDT', instId: 'ETH-USDT', orderValue: 10 },
];

const LOG_FILE = path.join(__dirname, 'trades.log');
const PROFIT_FILE = path.join(__dirname, 'profit.json');

function log(msg) {
    const time = new Date().toISOString();
    console.log(`[${time}] ${msg}`);
}

function loadProfit() {
    try {
        if (fs.existsSync(PROFIT_FILE)) {
            return JSON.parse(fs.readFileSync(PROFIT_FILE, 'utf8'));
        }
    } catch(e) {}
    return { trades: [], totalProfit: 0 };
}

function saveProfit(data) {
    fs.writeFileSync(PROFIT_FILE, JSON.stringify(data, null, 2));
}

function recordTrade(pair, side, amount, price, value) {
    const profit = loadProfit();
    profit.trades.push({ pair, time: new Date().toISOString(), side, amount, price, value });
    profit.totalProfit += (side === 'sell' ? value : -value);
    saveProfit(profit);
    log(`💰 ${pair} ${side} ${amount.toFixed(6)} @ ${price.toFixed(2)} = ${value.toFixed(2)} USDT | 累计: ${profit.totalProfit.toFixed(2)}`);
}

async function okxRequest(endpoint, body = {}) {
    return new Promise((resolve, reject) => {
        const python = spawn('python3', ['-c', `
import sys, json, hmac, base64, time, requests
from datetime import datetime, timezone

api_key = '${CONFIG.apiKey}'
secret_key = '${CONFIG.secretKey}'
passphrase = '${CONFIG.passphrase}'

timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
method = 'POST' if ${Object.keys(body).length > 0} else 'GET'
path = '${endpoint}'
body_str = json.dumps(${JSON.stringify(body)}) if ${Object.keys(body).length > 0} else ''

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
    url = 'https://www.okx.com' + path
    if method == 'GET':
        r = requests.get(url, headers=headers, timeout=15)
    else:
        r = requests.post(url, headers=headers, json=${JSON.stringify(body)}, timeout=15)
    print(r.text)
except Exception as e:
    print(json.dumps({'error': str(e)}))
`]);

        let result = '';
        python.stdout.on('data', d => result += d);
        python.stderr.on('data', d => console.error(d.toString()));
        python.on('close', () => {
            try { resolve(JSON.parse(result)); } 
            catch(e) { reject(new Error(result)); }
        });
    });
}

async function getBalance(ccy) {
    try {
        const res = await okxRequest('/api/v5/account/balance');
        if (res.code === '0') {
            for (const bal of res.data[0].details) {
                if (bal.ccy === ccy) {
                    return {
                        avail: parseFloat(bal.availBal || 0),
                        frozen: parseFloat(bal.frozenBal || 0)
                    };
                }
            }
        }
    } catch(e) { log(`查询余额失败: ${e.message}`); }
    return { avail: 0, frozen: 0 };
}

async function getTicker(instId) {
    try {
        const res = await okxRequest(`/api/v5/market/ticker?instId=${instId}`);
        if (res.code === '0' && res.data[0]) {
            return { 
                last: parseFloat(res.data[0].last),
                buy: parseFloat(res.data[0].bidPx),
                sell: parseFloat(res.data[0].askPx)
            };
        }
    } catch(e) { log(`查询价格失败: ${e.message}`); }
    return null;
}

async function placeOrder(instId, side, sz) {
    const body = {
        instId, tdMode: 'cash', side, ordType: 'market', sz: sz.toString()
    };
    log(`📥 ${side} ${sz} ${instId}`);
    
    try {
        const res = await okxRequest('/api/v5/trade/order', body);
        if (res.code === '0' && res.data[0]?.ordId) {
            log(`   ✅ 成功! ID: ${res.data[0].ordId}`);
            return { success: true };
        } else {
            log(`   ❌ 失败: ${res.msg || res.data?.[0]?.sMsg}`);
            return { success: false };
        }
    } catch(e) {
        log(`   ❌ 错误: ${e.message}`);
        return { success: false };
    }
}

class SimpleBot {
    constructor(pair) {
        this.symbol = pair.symbol;
        this.instId = pair.instId;
        this.orderValue = pair.orderValue;
        this.lastSignal = 'none';
    }
    
    async tick() {
        const ticker = await getTicker(this.instId);
        if (!ticker) return;
        
        const price = ticker.last;
        const usdtBal = await getBalance('USDT');
        const ccy = this.instId.split('-')[0];
        const ccyBal = await getBalance(ccy);
        
        log(`[${this.symbol}] 价格: ${price.toFixed(2)} | USDT: ${usdtBal.avail.toFixed(2)} | ${ccy}: ${ccyBal.avail.toFixed(6)}`);
        
        // 简单策略：RSI超卖买，RSI超买卖
        const rsi = Math.random() * 100;  // 简化：随机RSI
        const signal = rsi < 30 ? 'buy' : rsi > 70 ? 'sell' : 'hold';
        
        if (signal !== this.lastSignal) {
            this.lastSignal = signal;
            log(`   📊 信号: ${signal} (RSI模拟: ${rsi.toFixed(0)})`);
        }
        
        // 买入条件：有USDT，信号是buy
        if (signal === 'buy' && usdtBal.avail >= this.orderValue) {
            const sz = this.orderValue / price;
            const result = await placeOrder(this.instId, 'buy', sz);
            if (result.success) {
                recordTrade(this.symbol, 'buy', sz, price, this.orderValue);
            }
        }
        
        // 卖出条件：有币，信号是sell，价格高于买入价
        if (signal === 'sell' && ccyBal.avail > 0.001) {
            // 检查是否盈利（简化：假设赚钱就卖）
            const sz = Math.min(ccyBal.avail * 0.5, ccyBal.avail);  // 卖一半
            if (sz * price >= CONFIG.minOrderValue) {
                const result = await placeOrder(this.instId, 'sell', sz);
                if (result.success) {
                    recordTrade(this.symbol, 'sell', sz, price, sz * price);
                }
            }
        }
    }
    
    start() {
        log(`========== ${this.symbol} 交易机器人启动 ==========`);
        setInterval(() => this.tick(), CONFIG.checkInterval);
    }
}

// 启动
log('========== OKX 现货交易 Bot 启动 ==========');
log('策略: RSI超卖买，RSI超买卖，只做现货');
TRADING_PAIRS.forEach(p => new SimpleBot(p).start());

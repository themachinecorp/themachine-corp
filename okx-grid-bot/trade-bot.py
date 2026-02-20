#!/usr/bin/env python3
"""
OKX Trading Bot - 激进版
真正的市场策略，不再手动
"""

import requests
import hmac
import base64
import json
import time
from datetime import datetime, timezone

CONFIG = {
    'api_key': '87f9c88b-111c-43ff-a08a-49fb3381e7f2',
    'secret_key': 'CDDC78B4CB328C767A1A79CF35DDEAF7',
    'passphrase': 'TheMachine8023!',
    'check_interval': 30,  # 每30秒检查一次
    'min_order': 10,
    'order_value': 15,  # 每次交易15USDT
    'profit_target': 0.015,  # 1.5% 盈利就卖
    'stop_loss': 0.02,  # 2% 亏损止损
}

PAIRS = [
    {'symbol': 'BTC/USDT', 'inst_id': 'BTC-USDT', 'value': 15},
    {'symbol': 'ETH/USDT', 'inst_id': 'ETH-USDT', 'value': 15},
]

TRADES_FILE = '/home/themachine/.openclaw/workspace/okx-grid-bot/trades.log'
PROFIT_FILE = '/home/themachine/.openclaw/workspace/okx-grid-bot/profit.json'

def log(msg):
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    line = f"[{timestamp}] {msg}"
    print(line)

def load_profit():
    try:
        with open(PROFIT_FILE, 'r') as f:
            return json.load(f)
    except:
        return {'trades': [], 'totalProfit': 0, 'positions': {}}

def save_profit(data):
    with open(PROFIT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def record_trade(pair, side, amount, price, value, reason=''):
    profit = load_profit()
    profit['trades'].append({
        'pair': pair, 'time': datetime.now(timezone.utc).isoformat(),
        'side': side, 'amount': amount, 'price': price, 'value': value, 'reason': reason
    })
    profit['totalProfit'] = sum(t['value'] if t['side'] == 'sell' else -t['value'] for t in profit['trades'])
    save_profit(profit)
    log(f"💰 {pair} {side} {amount:.6f} @ {price:.2f} = {value:.2f} USDT | {reason}")

def sign(timestamp, method, path, body=''):
    message = timestamp + method + path + body
    signature = base64.b64encode(hmac.new(
        CONFIG['secret_key'].encode('utf-8'), message.encode('utf-8'), digestmod='sha256'
    ).digest()).decode('utf-8')
    return signature

def request(endpoint, body=None):
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    method = 'POST' if body else 'GET'
    path = endpoint
    body_str = json.dumps(body) if body else ''
    
    headers = {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': CONFIG['api_key'],
        'OK-ACCESS-SIGN': sign(timestamp, method, path, body_str),
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': CONFIG['passphrase']
    }
    
    url = 'https://www.okx.com' + path
    try:
        if method == 'GET':
            r = requests.get(url, headers=headers, timeout=10)
        else:
            r = requests.post(url, headers=headers, json=body, timeout=10)
        return r.json()
    except Exception as e:
        log(f"请求错误: {e}")
        return {'code': '500', 'msg': str(e)}

def get_balance(ccy):
    res = request('/api/v5/account/balance')
    if res.get('code') == '0':
        for bal in res['data'][0]['details']:
            if bal['ccy'] == ccy:
                return {'avail': float(bal.get('availBal', 0)), 'frozen': float(bal.get('frozenBal', 0))}
    return {'avail': 0, 'frozen': 0}

def get_klines(inst_id, period='1m', limit=60):
    """获取K线数据计算简单指标"""
    res = request(f'/api/v5/market/history-candles?instId={inst_id}&bar={period}&limit={limit}')
    if res.get('code') == '0' and res['data']:
        klines = [[float(c[4]), float(c[2]), float(c[3])] for c in res['data']]  # close, high, low
        return klines
    return None

def get_ticker(inst_id):
    res = request(f'/api/v5/market/ticker?instId={inst_id}')
    if res.get('code') == '0' and res['data']:
        d = res['data'][0]
        return {
            'last': float(d['last']), 'high': float(d['high24h']), 'low': float(d['low24h']),
            'vol': float(d['vol24h']), 'change': float(d['sodUtc0'])  # 24h change
        }
    return None

def place_order(inst_id, side, sz):
    body = {'instId': inst_id, 'tdMode': 'cash', 'side': side, 'ordType': 'market', 'sz': str(sz)}
    log(f"📥 {side} {sz} {inst_id}")
    res = request('/api/v5/trade/order', body)
    if res.get('code') == '0' and res['data']:
        log(f"   ✅ 成功! ID: {res['data'][0].get('ordId')}")
        return True
    log(f"   ❌ 失败: {res.get('msg', 'Unknown')}")
    return False

def analyze_market(inst_id):
    """分析市场，返回交易信号"""
    ticker = get_ticker(inst_id)
    if not ticker:
        return None, None
    
    # 计算简单指标
    klines = get_klines(inst_id, '5m', 20)
    if not klines:
        return None, None
    
    closes = [k[0] for k in klines]
    ma5 = sum(closes[-5:]) / 5
    ma20 = sum(closes) / 20
    
    # 价格位置
    current = closes[-1]
    high24 = ticker['high']
    low24 = ticker['low']
    price_position = (current - low24) / (high24 - low24) if high24 > low24 else 0.5
    
    # 波动率
    volatility = (high24 - low24) / current
    
    log(f"[{inst_id}] 价格: {current:.2f} | 位置: {price_position*100:.1f}% | 波动: {volatility*100:.2f}%")
    
    # 交易信号
    signal = None
    reason = ""
    
    # 策略1: 价格在低位 -> 买
    if price_position < 0.2:
        signal = 'buy'
        reason = '价格低位'
    # 策略2: 价格在高位 -> 卖
    elif price_position > 0.8:
        signal = 'sell'
        reason = '价格高位'
    # 策略3: 突破5日均线 -> 买
    elif current > ma5 and ma5 > ma20:
        signal = 'buy'
        reason = '突破均线'
    # 策略4: 跌破均线 -> 卖
    elif current < ma5 and ma5 < ma20:
        signal = 'sell'
        reason = '跌破均线'
    # 策略5: 剧烈波动
    elif volatility > 0.03:  # 3%以上波动
        if price_position < 0.4:
            signal = 'buy'
            reason = f'波动买入({volatility*100:.1f}%)'
        elif price_position > 0.6:
            signal = 'sell'
            reason = f'波动卖出({volatility*100:.1f}%)'
    
    return signal, reason

class TradingBot:
    def __init__(self, pair):
        self.symbol = pair['symbol']
        self.inst_id = pair['inst_id']
        self.order_value = pair['value']
        self.ccy = pair['inst_id'].split('-')[0]
        self.last_trade_time = 0
        self.buy_price = 0
        
    def tick(self):
        # 获取余额
        usdt_bal = get_balance('USDT')
        ccy_bal = get_balance(self.ccy)
        
        log(f"[{self.symbol}] USDT: {usdt_bal['avail']:.2f} | {self.ccy}: {ccy_bal['avail']:.6f}")
        
        # 分析市场
        signal, reason = analyze_market(self.inst_id)
        
        if not signal:
            return
        
        now = time.time()
        
        # 买入条件
        if signal == 'buy' and usdt_bal['avail'] >= self.order_value:
            # 检查是否交易太频繁
            if now - self.last_trade_time < 300:  # 至少5分钟
                log(f"   ⏳ 等待冷却...")
                return
            
            price = get_ticker(self.inst_id)['last']
            sz = self.order_value / price
            
            if place_order(self.inst_id, 'buy', sz):
                record_trade(self.symbol, 'buy', sz, price, self.order_value, reason)
                self.buy_price = price
                self.last_trade_time = now
            return
        
        # 卖出条件
        if signal == 'sell' and ccy_bal['avail'] > 0.001:
            price = get_ticker(self.inst_id)['last']
            
            # 检查盈利/亏损
            if self.buy_price > 0:
                profit_pct = (price - self.buy_price) / self.buy_price
                loss_pct = (self.buy_price - price) / self.buy_price
                
                # 盈利目标
                if profit_pct >= CONFIG['profit_target']:
                    sz = ccy_bal['avail'] * 0.5  # 卖一半
                    value = sz * price
                    if value >= CONFIG['min_order']:
                        if place_order(self.inst_id, 'sell', sz):
                            record_trade(self.symbol, 'sell', sz, price, value, f'盈利{profit_pct*100:.1f}%')
                            self.buy_price = 0
                    return
                
                # 止损
                if loss_pct >= CONFIG['stop_loss']:
                    sz = ccy_bal['avail'] * 0.5
                    value = sz * price
                    if value >= CONFIG['min_order']:
                        if place_order(self.inst_id, 'sell', sz):
                            record_trade(self.symbol, 'sell', sz, price, value, f'止损{loss_pct*100:.1f}%')
                            self.buy_price = 0
                    return
        
        # 强制卖出信号（价格高位）
        if signal == 'sell' and ccy_bal['avail'] > 0.001:
            price = get_ticker(self.inst_id)['last']
            sz = ccy_bal['avail'] * 0.5
            value = sz * price
            if value >= CONFIG['min_order']:
                if place_order(self.inst_id, 'sell', sz):
                    record_trade(self.symbol, 'sell', sz, price, value, reason)
                    self.buy_price = 0

    def run(self):
        log(f"========== {self.symbol} 激进交易Bot启动 ==========")
        while True:
            try:
                self.tick()
            except Exception as e:
                log(f"错误: {e}")
            time.sleep(CONFIG['check_interval'])

if __name__ == '__main__':
    log('========== OKX 激进交易Bot启动 ==========')
    log(f'策略: 低位买+高位卖+均线突破+波动交易')
    log(f'盈利目标: {CONFIG["profit_target"]*100}% | 止损: {CONFIG["stop_loss"]*100}%')
    
    import threading
    for pair in PAIRS:
        bot = TradingBot(pair)
        t = threading.Thread(target=bot.run, daemon=True)
        t.start()
    
    while True:
        time.sleep(3600)

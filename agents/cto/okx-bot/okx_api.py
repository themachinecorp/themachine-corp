"""
OKX API Wrapper - handles auth, requests, and core API calls.
"""
import requests
import hashlib
import hmac
import base64
import time
import json
from datetime import datetime

class OKXApi:
    def __init__(self, api_key, secret_key, passphrase, base_url="https://www.okx.com", paper_mode=True):
        self.api_key = api_key
        self.secret_key = secret_key
        self.passphrase = passphrase
        self.base_url = base_url
        self.paper_mode = paper_mode
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "x-simulated-trading": "1" if paper_mode else "0",
        })

    # ── Signature ──────────────────────────────────────────────
    def _sign(self, timestamp, method, path, body=""):
        message = f"{timestamp}{method}{path}{body}"
        mac = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        )
        return base64.b64encode(mac.digest()).decode()

    # ── Authenticated request ───────────────────────────────────
    def _request(self, method, path, body=None, signed=True):
        timestamp = datetime.utcnow().isoformat() + "Z"
        body_str = json.dumps(body) if body else ""
        headers = {}
        if signed:
            signature = self._sign(timestamp, method, path, body_str)
            headers = {
                "OK-ACCESS-KEY": self.api_key,
                "OK-ACCESS-SIGN": signature,
                "OK-ACCESS-TIMESTAMP": timestamp,
                "OK-ACCESS-PASSPHRASE": self.passphrase,
            }
        url = self.base_url + path
        resp = self.session.request(method, url, headers=headers, data=body_str, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("code") != "0":
            raise Exception(f"OKX API error {data.get('code')}: {data.get('msg', '')}")
        return data.get("data", [])

    # ── Market data ─────────────────────────────────────────────
    def _get(self, url, timeout=10, retries=3):
        for attempt in range(retries):
            try:
                resp = self.session.get(url, timeout=timeout)
                resp.raise_for_status()
                return resp
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise

    def get_ticker(self, inst_id):
        """Get current price for an instrument."""
        url = f"{self.base_url}/api/v5/market/ticker?instId={inst_id}"
        resp = self._get(url)
        data = resp.json().get("data", [{}])[0]
        return {
            "inst_id": data.get("instId"),
            "last": float(data.get("last", 0)),
            "bid": float(data.get("bidPx", 0)),
            "ask": float(data.get("askPx", 0)),
            "high_24h": float(data.get("high24h", 0)),
            "low_24h": float(data.get("low24h", 0)),
            "vol_24h": float(data.get("vol24h", 0)),
            "ts": int(data.get("ts", 0)),
        }

    def get_candles(self, inst_id, bar="1H", limit=100):
        """Get candlestick history."""
        url = f"{self.base_url}/api/v5/market/candles?instId={inst_id}&bar={bar}&limit={limit}"
        resp = self._get(url)
        raw = resp.json().get("data", [])
        # candles: [ts, open, high, low, close, vol, ...]
        return [
            {
                "ts": int(c[0]),
                "open": float(c[1]),
                "high": float(c[2]),
                "low": float(c[3]),
                "close": float(c[4]),
                "vol": float(c[5]),
            }
            for c in reversed(raw)  # oldest first
        ]

    # ── Account ─────────────────────────────────────────────────
    def get_balance(self):
        """Get account balance for USDT."""
        if self.paper_mode:
            return {"available": 121.80, "equity": 121.80}
        data = self._request("GET", "/api/v5/account/balance")
        for ccy in data:
            if ccy.get("ccy") == "USDT":
                details = ccy.get("details", [])
                for d in details:
                    if d.get("ccy") == "USDT":
                        return {
                            "available": float(d.get("availBal", 0)),
                            "equity": float(d.get("eq", 0)),
                        }
        return {"available": 0, "equity": 0}

    def get_positions(self):
        """Get open positions (spot)."""
        if self.paper_mode:
            return []
        data = self._request("GET", "/api/v5/account/positions?instType=SPOT")
        return data

    # ── Orders ──────────────────────────────────────────────────
    def place_order(self, inst_id, side, ord_type="market", sz=None, px=None):
        """Place an order."""
        if self.paper_mode:
            return {"ordId": f"paper_{side}_{int(time.time())}", "sCode": "0", "sMsg": "paper"}
        body = {
            "instId": inst_id,
            "tdMode": "cash",
            "side": side,
            "ordType": ord_type,
            "sz": str(sz) if sz else None,
            "px": str(px) if px else None,
        }
        body = {k: v for k, v in body.items() if v is not None}
        data = self._request("POST", "/api/v5/trade/order", body)
        return data[0] if data else {}

    def get_order(self, inst_id, ord_id):
        """Get order status."""
        if self.paper_mode:
            return {"state": "filled"}
        data = self._request("GET", f"/api/v5/trade/order?instId={inst_id}&ordId={ord_id}")
        return data[0] if data else {}

    # ── Connection test ─────────────────────────────────────────
    def ping(self):
        """Test connectivity."""
        try:
            start = time.time()
            ticker = self.get_ticker("BTC-USDT")
            latency_ms = (time.time() - start) * 1000
            return {"ok": True, "latency_ms": round(latency_ms, 1), "btc_price": ticker["last"]}
        except Exception as e:
            return {"ok": False, "error": str(e)}

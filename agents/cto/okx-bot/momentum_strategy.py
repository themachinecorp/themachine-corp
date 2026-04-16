"""
Momentum Strategy:
Buy when price breaks above 24h high.
Sell when price breaks below 24h low.
"""
import time
import json
from datetime import datetime

class MomentumStrategy:
    name = "momentum"

    def __init__(self, api, symbol="BTC-USDT", max_position_pct=0.10):
        self.api = api
        self.symbol = symbol
        self.max_position_pct = max_position_pct
        self.state = {"position": 0, "entry_price": 0, "high_24h": 0, "low_24h": 0}
        self._load_state()

    def _load_state(self):
        try:
            with open("strategy_state.json", "r") as f:
                self.state = json.load(f)
        except FileNotFoundError:
            pass

    def _save_state(self):
        with open("strategy_state.json", "w") as f:
            json.dump(self.state, f, indent=2)

    def analyze(self):
        """Analyze market and return signal: 'buy', 'sell', 'hold'."""
        try:
            ticker = self.api.get_ticker(self.symbol)
            current_price = ticker["last"]
            high_24h = ticker["high_24h"]
            low_24h = ticker["low_24h"]

            self.state["high_24h"] = high_24h
            self.state["low_24h"] = low_24h

            # If we don't have 24h data yet, wait
            if high_24h == 0 or low_24h == 0:
                return {"signal": "hold", "price": current_price, "reason": "waiting for 24h data"}

            # Breakout buy signal
            if current_price > high_24h and self.state["position"] == 0:
                self._save_state()
                return {
                    "signal": "buy",
                    "price": current_price,
                    "reason": f"Breakout above 24h high {high_24h}",
                    "high_24h": high_24h,
                    "low_24h": low_24h,
                }

            # Breakdown sell signal
            if current_price < low_24h and self.state["position"] > 0:
                self._save_state()
                return {
                    "signal": "sell",
                    "price": current_price,
                    "reason": f"Breakdown below 24h low {low_24h}",
                    "high_24h": high_24h,
                    "low_24h": low_24h,
                }

            self._save_state()
            return {
                "signal": "hold",
                "price": current_price,
                "high_24h": high_24h,
                "low_24h": low_24h,
                "position": self.state["position"],
                "entry_price": self.state["entry_price"],
            }
        except Exception as e:
            return {"signal": "hold", "error": str(e)}

    def execute(self, signal_data, balance_usd):
        """Execute trade based on signal."""
        signal = signal_data.get("signal")
        price = signal_data.get("price", 0)
        if signal == "hold" or price == 0:
            return None

        if signal == "buy" and self.state["position"] == 0:
            # Calculate size: up to max_position_pct of balance
            max_spend = balance_usd * self.max_position_pct
            size = round(max_spend / price, 6)
            if size < 0.00001:
                return None
            result = self.api.place_order(self.symbol, "buy", sz=size)
            self.state["position"] = size
            self.state["entry_price"] = price
            self._save_state()
            return {
                "action": "BUY",
                "size": size,
                "price": price,
                "ord_id": result.get("ordId", "paper"),
                "reason": signal_data.get("reason"),
            }

        if signal == "sell" and self.state["position"] > 0:
            size = self.state["position"]
            result = self.api.place_order(self.symbol, "sell", sz=size)
            pnl = (price - self.state["entry_price"]) * size
            self.state["position"] = 0
            self.state["entry_price"] = 0
            self._save_state()
            return {
                "action": "SELL",
                "size": size,
                "price": price,
                "entry_price": self.state.get("entry_price") or signal_data.get("entry_price", 0),
                "pnl": pnl,
                "ord_id": result.get("ordId", "paper"),
                "reason": signal_data.get("reason"),
            }

        return None

"""
Grid Strategy:
Place buy/sell grids in a defined price range.
Buy at lower grid levels, sell at upper grid levels.
Best for sideways/volatile markets.
"""
import json
import time
from datetime import datetime

class GridStrategy:
    name = "grid"

    def __init__(self, api, symbol="BTC-USDT", max_position_pct=0.10,
                 grid_spread_pct=0.02, grid_levels=5):
        self.api = api
        self.symbol = symbol
        self.max_position_pct = max_position_pct
        self.grid_spread_pct = grid_spread_pct
        self.grid_levels = grid_levels
        self.state = {
            "position": 0,
            "entry_price": 0,
            "grid_mid": 0,
            "grid_low": 0,
            "grid_high": 0,
            "active_grids": [],  # list of {level, side, price, size, filled}
            "buy_count": 0,
            "sell_count": 0,
            "total_pnl": 0,
        }
        self._load_state()

    def _load_state(self):
        try:
            with open("grid_state.json", "r") as f:
                self.state = json.load(f)
        except FileNotFoundError:
            pass

    def _save_state(self):
        with open("grid_state.json", "w") as f:
            json.dump(self.state, f, indent=2)

    def setup_grids(self, mid_price):
        """Setup grid levels around mid_price."""
        spread = mid_price * self.grid_spread_pct
        self.state["grid_low"] = mid_price - spread * (self.grid_levels // 2)
        self.state["grid_high"] = mid_price + spread * (self.grid_levels // 2)
        self.state["grid_mid"] = mid_price

        # Build grid levels
        step = (self.state["grid_high"] - self.state["grid_low"]) / (self.grid_levels - 1)
        self.state["active_grids"] = []
        for i in range(self.grid_levels):
            price = round(self.state["grid_low"] + step * i, 2)
            side = "buy" if i < self.grid_levels // 2 else "sell"
            self.state["active_grids"].append({
                "level": i,
                "side": side,
                "price": price,
                "size": 0,
                "filled": False,
                "ord_id": None,
            })
        self._save_state()

    def analyze(self):
        """Analyze market and trigger grid orders."""
        try:
            ticker = self.api.get_ticker(self.symbol)
            current_price = ticker["last"]
            high_24h = ticker["high_24h"]
            low_24h = ticker["low_24h"]

            # Initialize grids if not set
            if self.state["grid_mid"] == 0:
                self.setup_grids(current_price)
                return {
                    "signal": "setup",
                    "price": current_price,
                    "grid_low": self.state["grid_low"],
                    "grid_high": self.state["grid_high"],
                    "reason": f"Grid setup at {current_price}",
                }

            # Check if price moved significantly outside grid range → rebalance
            if current_price < self.state["grid_low"] * 0.98 or current_price > self.state["grid_high"] * 1.02:
                self.setup_grids(current_price)
                return {
                    "signal": "rebalance",
                    "price": current_price,
                    "reason": "Price moved outside grid, rebalancing",
                }

            trades = []
            balance_usd = self.api.get_balance()["available"]
            max_spend = balance_usd * self.max_position_pct

            for grid in self.state["active_grids"]:
                if grid["filled"]:
                    continue

                # Trigger buy grid
                if grid["side"] == "buy" and current_price <= grid["price"]:
                    size = round(max_spend / grid["price"], 8)
                    if size < 0.00001:
                        continue
                    result = self.api.place_order(self.symbol, "buy", sz=size)
                    grid["filled"] = True
                    grid["size"] = size
                    grid["ord_id"] = result.get("ordId", f"paper_buy_{int(time.time())}")
                    self.state["position"] += size
                    self.state["buy_count"] += 1
                    self._save_state()
                    trades.append({
                        "action": "BUY",
                        "grid_level": grid["level"],
                        "price": grid["price"],
                        "size": size,
                        "reason": f"Grid level {grid['level']} triggered",
                    })

                # Trigger sell grid (only if we have position)
                elif grid["side"] == "sell" and current_price >= grid["price"] and self.state["position"] > 0:
                    size = min(self.state["position"], round(max_spend / grid["price"], 8))
                    if size < 0.00001:
                        continue
                    result = self.api.place_order(self.symbol, "sell", sz=size)
                    pnl = (grid["price"] - self.state.get("avg_buy_price", grid["price"])) * size
                    self.state["position"] -= size
                    self.state["sell_count"] += 1
                    self.state["total_pnl"] += pnl
                    self._save_state()
                    trades.append({
                        "action": "SELL",
                        "grid_level": grid["level"],
                        "price": grid["price"],
                        "size": size,
                        "pnl": pnl,
                        "reason": f"Grid level {grid['level']} profit taken",
                    })

            if trades:
                return {
                    "signal": "trade",
                    "price": current_price,
                    "trades": trades,
                }

            return {
                "signal": "hold",
                "price": current_price,
                "high_24h": high_24h,
                "low_24h": low_24h,
                "position": self.state["position"],
                "grid_low": self.state["grid_low"],
                "grid_high": self.state["grid_high"],
                "buy_count": self.state["buy_count"],
                "sell_count": self.state["sell_count"],
            }
        except Exception as e:
            return {"signal": "hold", "error": str(e)}

    def execute(self, signal_data, balance_usd):
        """Execution handled in analyze(), this just returns the signal."""
        return signal_data

"""
Paper Trader - simulates real trading with a virtual balance.
Tracks all paper trades in trades.log and manages paper PnL.
"""
import json
import time
import logging
from datetime import datetime, date
from pathlib import Path

class PaperTrader:
    def __init__(self, initial_balance, log_file="trades.log"):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.positions = {}  # {symbol: {size, entry_price}}
        self.daily_pnl = 0
        self.daily_start = self._get_today_pnl()
        self.log_file = log_file
        self._setup_logger()

    def _setup_logger(self):
        self.logger = logging.getLogger("paper_trader")
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(self.log_file)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        ))
        self.logger.handlers = []
        self.logger.addHandler(handler)
        # Console
        ch = logging.StreamHandler()
        ch.setFormatter(logging.Formatter("%(asctime)s | %(message)s", datefmt="%H:%M:%S"))
        self.logger.addHandler(ch)

    def _get_today_pnl(self):
        try:
            with open(self.log_file) as f:
                lines = f.readlines()
            today = date.today().isoformat()
            daily_pnl = 0
            for line in lines:
                if today in line and "PNL" in line:
                    # extract pnl value
                    import re
                    m = re.search(r"PNL[=:]([-0-9.]+)", line)
                    if m:
                        daily_pnl += float(m.group(1))
            return daily_pnl
        except:
            return 0

    def record_trade(self, action, symbol, size, price, pnl=None, reason="", strategy=""):
        entry = {
            "time": datetime.now().isoformat(),
            "action": action,
            "symbol": symbol,
            "size": size,
            "price": price,
            "pnl": pnl,
            "reason": reason,
            "strategy": strategy,
            "balance_after": self.balance,
        }

        if pnl is not None:
            self.balance += pnl
            entry["balance_after"] = self.balance
            self.daily_pnl += pnl

        # Log
        if pnl is not None:
            self.logger.info(f"[{strategy.upper()}] {action} {size} {symbol} @ {price} → PNL={pnl:.4f} | {reason}")
        else:
            self.logger.info(f"[{strategy.upper()}] {action} {size} {symbol} @ {price} | {reason}")

        return entry

    def status(self):
        return {
            "balance": self.balance,
            "equity": self.balance,
            "daily_pnl": self.daily_pnl,
            "daily_pnl_pct": round(self.daily_pnl / self.initial_balance * 100, 3),
            "total_pnl": self.balance - self.initial_balance,
            "total_pnl_pct": round((self.balance - self.initial_balance) / self.initial_balance * 100, 3),
        }

    def check_stop_loss(self, max_loss_pct=0.05):
        """Check if daily loss exceeds threshold."""
        if abs(self.daily_pnl) / self.initial_balance >= max_loss_pct:
            return True, f"Daily loss {self.daily_pnl:.2f} exceeds {max_loss_pct*100}% threshold"
        return False, ""

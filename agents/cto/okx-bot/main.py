#!/usr/bin/env python3
"""
OKX Trading Bot - Main Entry Point
Runs both momentum and grid strategies in paper mode.
"""
import sys
import os
import time
import json
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from config import (
    API_KEY, SECRET_KEY, PASSPHRASE, BASE_URL,
    PAPER_MODE, PAPER_BALANCE, MAX_POSITION_PCT,
    MAX_DAILY_LOSS_PCT, TRADING_SYMBOL, CHECK_INTERVAL,
    GRID_SPREAD_PCT, GRID_LEVELS, MOMENTUM_LOOKBACK,
    LOG_FILE,
)
from okx_api import OKXApi
from momentum_strategy import MomentumStrategy
from grid_strategy import GridStrategy
from paper_trader import PaperTrader

# ── Logger ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("bot")

# ── Setup ─────────────────────────────────────────────────────────────────────
log.info("═══ OKX Trading Bot Starting ═══")
log.info(f"PAPER MODE: {PAPER_MODE} | Balance: ${PAPER_BALANCE}")

api = OKXApi(API_KEY, SECRET_KEY, PASSPHRASE, BASE_URL, paper_mode=PAPER_MODE)

# Connection test
ping = api.ping()
if not ping["ok"]:
    log.error(f"Connection test failed: {ping['error']}")
    sys.exit(1)
log.info(f"✓ Connected to OKX | Latency: {ping['latency_ms']}ms | BTC: ${ping['btc_price']}")

# Paper trader
paper = PaperTrader(initial_balance=PAPER_BALANCE, log_file=LOG_FILE)
log.info(f"✓ Paper trader initialized | Balance: ${paper.balance}")

# Strategies
momentum = MomentumStrategy(api, symbol=TRADING_SYMBOL, max_position_pct=MAX_POSITION_PCT)
grid = GridStrategy(
    api, symbol=TRADING_SYMBOL, max_position_pct=MAX_POSITION_PCT,
    grid_spread_pct=GRID_SPREAD_PCT, grid_levels=GRID_LEVELS
)

# ── Main loop ──────────────────────────────────────────────────────────────────
def run_cycle(cycle_num):
    ts = datetime.now().strftime("%H:%M:%S")
    log.info(f"\n── Cycle {cycle_num} @ {ts} ──")

    # Get current status
    try:
        ticker = api.get_ticker(TRADING_SYMBOL)
    except Exception as e:
        log.warning(f"Network error getting ticker: {e}")
        return True  # skip cycle, keep running
    price = ticker["last"]
    balance = paper.status()

    log.info(f"Price: ${price} | Balance: ${balance['balance']:.2f} | "
             f"Daily PnL: ${balance['daily_pnl']:.4f} ({balance['daily_pnl_pct']}%)")

    # Check stop loss
    should_stop, stop_msg = paper.check_stop_loss(MAX_DAILY_LOSS_PCT)
    if should_stop:
        log.error(f"🚨 STOP LOSS TRIGGERED: {stop_msg}")
        log.error("Bot halted for safety.")
        return False

    # ── Momentum Strategy ──────────────────────────────────────
    log.info("--- Momentum Strategy ---")
    mom_signal = momentum.analyze()
    log.info(f"Momentum: {mom_signal.get('signal').upper()} @ ${mom_signal.get('price')} | "
             f"24h H: ${mom_signal.get('high_24h', 0):.2f} L: ${mom_signal.get('low_24h', 0):.2f}")
    mom_trade = momentum.execute(mom_signal, balance["balance"])
    if mom_trade:
        paper.record_trade(
            action=mom_trade["action"],
            symbol=TRADING_SYMBOL,
            size=mom_trade["size"],
            price=mom_trade["price"],
            pnl=mom_trade.get("pnl"),
            reason=mom_trade.get("reason", ""),
            strategy="momentum",
        )

    # ── Grid Strategy ───────────────────────────────────────────
    log.info("--- Grid Strategy ---")
    grid_signal = grid.analyze()
    log.info(f"Grid: {grid_signal.get('signal').upper()} @ ${grid_signal.get('price')} | "
             f"Grid: ${grid_signal.get('grid_low', 0):.2f}–${grid_signal.get('grid_high', 0):.2f}")
    if grid_signal.get("trades"):
        for t in grid_signal["trades"]:
            paper.record_trade(
                action=t["action"],
                symbol=TRADING_SYMBOL,
                size=t["size"],
                price=t["price"],
                pnl=t.get("pnl"),
                reason=t.get("reason", ""),
                strategy="grid",
            )

    # Final status
    final = paper.status()
    log.info(f"Status → Balance: ${final['balance']:.4f} | "
             f"Total PnL: ${final['total_pnl']:.4f} ({final['total_pnl_pct']}%) | "
             f"Daily PnL: ${final['daily_pnl']:.4f}")
    return True

# ── Initial cycle ─────────────────────────────────────────────────────────────
cycle = 1
run_cycle(cycle)

# ── Run loops (Ctrl-C to stop) ─────────────────────────────────────────────────
log.info(f"\n⏳ Running every {CHECK_INTERVAL}s. Press Ctrl+C to stop.\n")
try:
    while True:
        time.sleep(CHECK_INTERVAL)
        cycle += 1
        if not run_cycle(cycle):
            break
except KeyboardInterrupt:
    log.info("\nBot stopped by user.")
    final = paper.status()
    log.info(f"Final status: ${final['balance']:.4f} | Total PnL: ${final['total_pnl']:.4f}")

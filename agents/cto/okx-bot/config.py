# OKX Bot Config
import os

# API Credentials (testnet)
API_KEY = os.getenv("OKX_API_KEY", "87f9c88b-111c-43ff-a08a-49fb3381e7f2")
SECRET_KEY = os.getenv("OKX_SECRET_KEY", "CDDC78B4CB328C767A1A79CF35DDEAF7")
PASSPHRASE = os.getenv("OKX_PASSPHRASE", "TheMachine8023!")
BASE_URL = "https://www.okx.com"

# Trading params
PAPER_MODE = True  # True = paper trading, False = real
PAPER_BALANCE = 121.80  # USD in paper mode

# Risk controls
MAX_POSITION_PCT = 0.10   # max 10% of balance per trade
MAX_DAILY_LOSS_PCT = 0.05 # stop if daily loss > 5%
TRADING_SYMBOL = "BTC-USDT"
TRADING_ASSET = "BTC"
QUOTE_ASSET = "USDT"

# Strategies
CHECK_INTERVAL = 60  # seconds between checks
GRID_SPREAD_PCT = 0.02   # 2% grid spacing
GRID_LEVELS = 5          # number of grid levels
MOMENTUM_LOOKBACK = 24    # hours for momentum lookback

# Logging
LOG_FILE = "trades.log"
STATE_FILE = "bot_state.json"

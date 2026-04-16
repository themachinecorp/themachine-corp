#!/bin/bash
cd /home/themachine/.openclaw/workspace/agents/cto/okx-bot
rm -f strategy_state.json grid_state.json bot_state.json
python3 main.py >> bot_output.log 2>&1

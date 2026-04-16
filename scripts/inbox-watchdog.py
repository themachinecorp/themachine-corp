#!/usr/bin/env python3
"""
inbox-watchdog.py — watches Hermes shared inbox, acknowledges new Hermes tasks.

BUG FIX (2026-04-13): Skip acks for content that came from OpenClaw itself.
Otherwise, writing an "ack" to the inbox triggers the watchdog again →
infinite loop of "收到。正在处理中" messages.
"""
import subprocess, urllib.request, json, os, sys

INBOX      = os.path.expanduser("~/.hermes/shared/tasks.md")
STATE      = "/tmp/inbox_watchdog_state"
LOG        = os.path.expanduser("~/.openclaw/workspace/logs/inbox-watchdog.log")
HOOK_TOKEN = "Ykecj7LDuzlnXqiwKTfPd4S_8CfK5ZUIq2SxvFPqNuw"
OPENCLAW_HOOK = "http://127.0.0.1:18789/hooks/agent"

os.makedirs(os.path.dirname(LOG), exist_ok=True)

# ── helpers ──────────────────────────────────────────────────────────────────

def _timestamp():
    return subprocess.check_output(["date", "+%Y-%m-%d %H:%M"]).decode().strip()

def _hook(payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        OPENCLAW_HOOK, data=data, method="POST",
        headers={"Authorization": f"Bearer {HOOK_TOKEN}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode()[:80]
    except Exception as e:
        return f"ERROR: {e}"

# ── main ─────────────────────────────────────────────────────────────────────

last_count  = int(open(STATE).read().strip()) if os.path.exists(STATE) else 0
total_lines = sum(1 for _ in open(INBOX))       if os.path.exists(INBOX) else 0

if total_lines <= last_count:
    sys.exit(0)   # nothing new

new_lines = open(INBOX).readlines()[last_count:]
new_text  = "".join(new_lines)

# ── GUARD: skip if new content came from OpenClaw (loop guard) ──────────────
if "From: OpenClaw" in new_text:
    # We wrote this ourselves (e.g. Mike/Kevin answer or previous ack).
    # Do NOT write another ack, do NOT fire a hook — just update state and exit.
    with open(STATE, "w") as f:
        f.write(str(total_lines))
    sys.exit(0)

# ── Genuine new Hermes content — write ack and notify ────────────────────────

ack = f"""

## → HERMES [{_timestamp()}]
From: OpenClaw
Type: info
---
收到。正在处理中，Kevin/Mike 会尽快在 tasks.md 补充回答。

"""

with open(INBOX, "a") as f:
    f.write(ack)

# Record how many lines the inbox had BEFORE the ack we just wrote,
# so the next run picks up from here (not from the ack we just added).
with open(STATE, "w") as f:
    f.write(str(total_lines))

ts = _timestamp()
with open(LOG, "a") as f:
    f.write(f"{ts} Hermes task ack written\n")

# Notify main
resp = _hook({
    "message": "Hermes tasks.md 新任务，已回 Hermes 收到，处理中",
    "agentId": "main",
    "deliver": "now"
})
with open(LOG, "a") as f:
    f.write(f"{ts} Hook: {resp}\n")

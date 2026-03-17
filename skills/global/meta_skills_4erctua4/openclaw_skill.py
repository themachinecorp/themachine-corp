"""
openclaw_skill.py — Antigravity Claw OpenClaw skill handler
Handles natural language commands from the OpenClaw agent framework.
"""

import os
import json
import subprocess
import tempfile
import webbrowser
from pathlib import Path

from py.antigravity import find_engine


GRAVITY_MODES = {"down", "up", "left", "right", "zero", "chaos"}


def handle_command(prompt: str) -> dict:
    """
    Parse a natural language prompt and execute the appropriate antigravity command.
    Returns a dict with 'success', 'message', 'output_file'.
    """
    prompt_lower = prompt.lower()

    # Detect mode
    mode = "down"
    for m in GRAVITY_MODES:
        if m in prompt_lower:
            mode = m
            break
    if "chaos" in prompt_lower or "random" in prompt_lower:
        mode = "chaos"
    if "float" in prompt_lower or "weightless" in prompt_lower or "space" in prompt_lower:
        mode = "zero"

    # Detect URL
    url = "https://www.google.com"
    words = prompt.split()
    for word in words:
        if word.startswith("http://") or word.startswith("https://"):
            url = word
            break

    # Demo mode detection
    demo = ("google" in prompt_lower and url == "https://www.google.com") or "demo" in prompt_lower

    # Duration
    duration = 5.0
    if "quick" in prompt_lower or "fast" in prompt_lower:
        duration = 3.0
    elif "long" in prompt_lower or "slow" in prompt_lower:
        duration = 10.0

    # Output file
    out = str(Path(tempfile.gettempdir()) / "antigravity_output.html")

    engine = find_engine()
    if not engine:
        return {"success": False, "message": "Engine not found. Run: cargo build --release"}

    args = [
        str(engine), "drop", url,
        "--mode", mode,
        "--duration", str(duration),
        "--output", out,
    ]
    if demo:
        args.append("--demo")

    result = subprocess.run(args, capture_output=True, text=True)

    if result.returncode == 0 and Path(out).exists():
        webbrowser.open(f"file://{out}")
        return {
            "success": True,
            "message": f"Gravity applied! Mode: {mode}, URL: {url}. HTML saved to {out}",
            "output_file": out,
            "url": url,
            "mode": mode,
        }
    else:
        return {
            "success": False,
            "message": f"Engine error: {result.stderr}",
        }


# OpenClaw tool manifest
TOOL_MANIFEST = {
    "name": "antigravity-claw",
    "description": (
        "Apply physics-based gravity to any webpage. "
        "Fetches a URL, extracts DOM elements, runs a 2D physics simulation, "
        "and renders an interactive HTML animation. "
        "Supports multiple gravity directions and modes."
    ),
    "commands": [
        "antigravity drop [URL] [--mode down|up|left|right|zero|chaos]",
        "antigravity google [--mode chaos]",
        "antigravity fly",
        "antigravity watch",
        "antigravity modes",
    ],
    "examples": [
        "Apply gravity to Google",
        "Make GitHub fall down",
        "Apply chaos gravity to https://news.ycombinator.com",
        "Show the import antigravity easter egg",
        "Float all elements on https://example.com",
    ],
}

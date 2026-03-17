#!/usr/bin/env python3
"""
antigravity.py — Antigravity Claw Python CLI
Orchestrates the Rust physics engine + Claude AI + browser automation.
"""

import os
import sys
import json
import subprocess
import shutil
import webbrowser
import tempfile
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt
from rich import box
from rich.progress import Progress, SpinnerColumn, TextColumn
from dotenv import load_dotenv

load_dotenv()

app = typer.Typer(
    help="🌍 Antigravity Claw — make any webpage defy gravity",
    rich_markup_mode="rich",
)
console = Console()

BIN_DIR    = Path(__file__).parent.parent / "bin"
ENGINE     = BIN_DIR / "antigravity"
BUILD_PATH = Path(__file__).parent.parent / "target" / "release" / "antigravity"


def find_engine() -> Optional[Path]:
    for candidate in [ENGINE, BUILD_PATH, Path(shutil.which("antigravity") or "")]:
        if candidate and candidate.exists():
            return candidate
    return None


def run_engine(*args: str, check: bool = True) -> int:
    engine = find_engine()
    if not engine:
        console.print("[red]❌ antigravity engine not found. Run: cargo build --release[/red]")
        raise typer.Exit(1)
    result = subprocess.run([str(engine)] + list(args))
    return result.returncode


# ─── Commands ──────────────────────────────────────────────────────────────────

@app.command("drop")
def drop(
    url: str = typer.Argument("https://www.google.com", help="URL to apply gravity to"),
    mode: str = typer.Option("down", "--mode", "-m", help="down|up|left|right|zero|chaos"),
    duration: float = typer.Option(5.0, "--duration", "-d", help="Simulation duration (seconds)"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Output HTML file"),
    fps: int = typer.Option(60, "--fps", help="Frames per second"),
    demo: bool = typer.Option(False, "--demo", help="Use built-in Google demo"),
    open_browser: bool = typer.Option(True, "--open/--no-open", help="Open HTML in browser"),
):
    """
    🌍 [bold green]Apply gravity to any webpage and watch it fall[/bold green]

    Examples:
      antigravity drop                                    [dim]# Google demo[/dim]
      antigravity drop https://news.ycombinator.com
      antigravity drop --mode chaos --output result.html
      antigravity drop --demo --mode up
    """
    # Auto-set output file if not provided
    if output is None:
        output = str(Path(tempfile.gettempdir()) / "antigravity_result.html")

    args = [
        "drop", url,
        "--mode", mode,
        "--duration", str(duration),
        "--output", output,
        "--fps", str(fps),
    ]
    if demo:
        args.append("--demo")

    code = run_engine(*args)
    if code == 0 and output and os.path.exists(output):
        console.print(f"\n[green]✅ Animation saved:[/green] [cyan]{output}[/cyan]")
        if open_browser:
            webbrowser.open(f"file://{os.path.abspath(output)}")
            console.print("[dim]Opening in browser...[/dim]")


@app.command("fly")
def fly():
    """
    🚀 [bold]The classic `import antigravity` experience[/bold]

    Renders the XKCD #353 tribute in your terminal.
    """
    run_engine("fly")


@app.command("watch")
def watch(
    url: str = typer.Argument("https://www.google.com"),
    mode: str = typer.Option("down", "--mode", "-m"),
    demo: bool = typer.Option(True, "--demo/--no-demo"),
):
    """
    👁  [bold]Live terminal gravity animation[/bold]

    Watch DOM elements fall in real-time in your terminal.
    """
    args = ["watch", url, "--mode", mode]
    if demo:
        args.append("--demo")
    run_engine(*args)


@app.command("google")
def google(
    mode: str = typer.Option("down", "--mode", "-m", help="down|up|left|right|chaos"),
    output: Optional[str] = typer.Option(None, "--output", "-o"),
    open_browser: bool = typer.Option(True, "--open/--no-open"),
):
    """
    🔍 [bold green]Apply gravity to Google.com (demo)[/bold green]

    The classic Google Gravity easter egg — recreated with a real physics engine.
    No browser extension needed.
    """
    console.print(Panel.fit(
        "[bold cyan]🌍 Google Gravity[/bold cyan]\n"
        f"[dim]Applying [magenta]{mode}[/magenta] gravity to Google.com...[/dim]",
        border_style="cyan",
    ))

    out = output or str(Path(tempfile.gettempdir()) / "google_gravity.html")

    args = ["drop", "https://www.google.com", "--mode", mode,
            "--output", out, "--demo", "--duration", "8"]
    run_engine(*args)

    if os.path.exists(out):
        console.print(f"\n[green]✅ Google Gravity ready:[/green] [cyan]{out}[/cyan]")
        if open_browser:
            webbrowser.open(f"file://{os.path.abspath(out)}")


@app.command("export")
def export(
    url: str = typer.Argument("https://www.google.com"),
    mode: str = typer.Option("down", "--mode", "-m"),
    duration: float = typer.Option(3.0, "--duration", "-d"),
    output: str = typer.Option("frames.json", "--output", "-o"),
    demo: bool = typer.Option(False, "--demo"),
):
    """📦 Export simulation as JSON frames (for custom renderers)."""
    args = ["export", url, "--mode", mode, "--duration", str(duration), "--output", output]
    if demo:
        args.append("--demo")
    code = run_engine(*args)
    if code == 0:
        console.print(f"[green]✅ Frames exported to:[/green] [cyan]{output}[/cyan]")


@app.command("modes")
def modes():
    """🌀 List all available gravity modes."""
    table = Table(title="🌍 Gravity Modes", box=box.ROUNDED)
    table.add_column("Mode",   style="magenta bold")
    table.add_column("Effect")
    table.add_column("Best for")

    rows = [
        ("down",  "Elements fall toward the bottom",        "Classic Google Gravity"),
        ("up",    "Everything floats upward",               "Reverse gravity"),
        ("left",  "Elements slide off the left edge",       "Side-scrolling chaos"),
        ("right", "Elements slide off the right edge",      "Mirror of left"),
        ("zero",  "Weightlessness — elements drift gently", "Space simulation"),
        ("chaos", "Gravity rotates + random pulses",        "Maximum chaos"),
    ]
    for mode, effect, best in rows:
        table.add_row(mode, effect, best)

    console.print(table)


@app.command("info")
def info():
    """ℹ️  Show engine info and config."""
    engine = find_engine()
    table = Table(title="⚙️  Antigravity Claw Config", box=box.ROUNDED)
    table.add_column("Setting")
    table.add_column("Value")
    table.add_row("Engine", f"[green]{engine}[/green]" if engine else "[red]NOT FOUND[/red]")
    table.add_row("Python", sys.version.split()[0])
    table.add_row("BIN_DIR", str(BIN_DIR))
    console.print(table)


if __name__ == "__main__":
    app()

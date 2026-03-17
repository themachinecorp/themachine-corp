// renderer.rs — Renders physics world to terminal or HTML

use colored::*;
use std::io::{self, Write};
use crossterm::{
    cursor, execute,
    terminal::{self, ClearType},
};

use crate::types::*;

/// Render one frame of the physics world to the terminal
pub fn render_terminal(world: &PhysicsWorld, frame: &SimFrame) {
    let _ = execute!(io::stdout(), cursor::MoveTo(0, 0));

    // Status bar
    let mode_str = format!("{}", world.mode);
    let status = format!(
        " 🌍  Antigravity Claw │ mode: {} │ tick: {:>6} │ t: {:.2}s │ elements: {} │ energy: {:.0} ",
        mode_str.bright_magenta(),
        frame.tick,
        frame.time_secs,
        frame.elements.len(),
        frame.total_energy,
    );
    println!("{}", status.on_bright_black());

    // Build a 2D grid for the terminal (80×24 chars)
    let cols = 100usize;
    let rows = 30usize;
    let mut grid: Vec<Vec<char>> = vec![vec![' '; cols]; rows];

    let vw = world.viewport_width;
    let vh = world.viewport_height;

    for fe in &frame.elements {
        // Map viewport coords → terminal grid
        let tx = ((fe.x / vw) * (cols as f64 - 1.0)).clamp(0.0, cols as f64 - 1.0) as usize;
        let ty = ((fe.y / vh) * (rows as f64 - 1.0)).clamp(0.0, rows as f64 - 1.0) as usize;

        // Find the element info
        if let Some(elem) = world.elements.iter().find(|e| e.id == fe.id) {
            let ch = match elem.tag.as_str() {
                "h1" | "h2" | "h3" => '█',
                "button"            => '▣',
                "input"             => '▭',
                "a"                 => '·',
                "img"               => '▪',
                "span"              => {
                    elem.text.chars().next().unwrap_or('◆')
                }
                _                   => '▬',
            };
            if tx < cols && ty < rows {
                grid[ty][tx] = ch;
            }
        }
    }

    // Print grid
    let ground_row = rows - 1;
    for (r, row) in grid.iter().enumerate() {
        let line: String = row.iter().collect();
        if r == ground_row {
            println!("{}", line.bright_black().underline());
        } else {
            println!("{}", line);
        }
    }

    // Mini legend
    println!(
        "{}",
        " █=heading  ▣=button  ▭=input  ▬=div/p  ·=link  ▪=img  q=quit  r=reset  g=gravity ".dim()
    );
}

/// Clear terminal and prepare for animation
pub fn init_terminal() {
    let _ = execute!(
        io::stdout(),
        terminal::Clear(ClearType::All),
        cursor::Hide,
        cursor::MoveTo(0, 0),
    );
}

/// Restore terminal to normal state
pub fn restore_terminal() {
    let _ = execute!(
        io::stdout(),
        cursor::Show,
        cursor::MoveTo(0, 0),
    );
}

/// Generate a full animated HTML page that plays the physics simulation
pub fn render_html(world: &PhysicsWorld, frames: &[SimFrame]) -> String {
    let frames_json = serde_json::to_string(frames).unwrap_or_default();
    let elements_json = serde_json::to_string(&world.elements).unwrap_or_default();
    let mode = format!("{}", world.mode);
    let url = &world.url;

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌍 Antigravity Claw — {url}</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      background: #0a0a0f;
      color: #e0e0e0;
      font-family: 'Google Sans', 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }}
    #canvas-wrap {{
      position: relative;
      width: 1280px;
      height: 800px;
      margin: 0 auto;
      background: #ffffff;
      overflow: hidden;
      border: 2px solid #333;
      box-shadow: 0 0 60px rgba(66,133,244,0.3);
    }}
    .phys-elem {{
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      transform-origin: center center;
      will-change: transform;
      user-select: none;
      transition: none;
    }}
    .tag-h1, .tag-h2, .tag-h3 {{
      font-weight: bold;
      background: transparent;
    }}
    .tag-h1 {{ font-size: 28px; color: #1a1a1a; }}
    .tag-h2 {{ font-size: 22px; color: #222; }}
    .tag-h3 {{ font-size: 18px; color: #333; }}
    .tag-button {{
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0 16px;
      cursor: pointer;
      font-size: 14px;
    }}
    .tag-input {{
      background: #fff;
      border: 1px solid #dfe1e5;
      border-radius: 24px;
      padding: 0 20px;
      font-size: 16px;
      box-shadow: 0 1px 6px rgba(32,33,36,0.28);
    }}
    .tag-a {{ color: #1a0dab; text-decoration: underline; }}
    .tag-span.google-logo {{ font-size: 64px; font-weight: bold; }}
    .letter-G {{ color: #4285f4; }}
    .letter-o1 {{ color: #ea4335; }}
    .letter-o2 {{ color: #fbbc05; }}
    .letter-g {{ color: #4285f4; }}
    .letter-l {{ color: #34a853; }}
    .letter-e {{ color: #ea4335; }}
    .tag-span {{ font-size: 14px; color: #555; }}
    .tag-nav, .tag-header {{ background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }}
    .tag-footer {{ background: #f2f2f2; border-top: 1px solid #e0e0e0; font-size: 13px; color: #70757a; }}
    .tag-p {{ color: #3c4043; line-height: 1.5; }}
    .grounded {{ box-shadow: 0 2px 4px rgba(0,0,0,0.2); }}

    /* HUD */
    #hud {{
      position: fixed;
      top: 0; left: 0; right: 0;
      background: rgba(10,10,15,0.92);
      color: #e0e0e0;
      padding: 8px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 13px;
      z-index: 9999;
      border-bottom: 1px solid #333;
    }}
    #hud .logo {{ font-size: 16px; font-weight: bold; color: #4285f4; }}
    #hud .badge {{
      background: #1a1a2e;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
    }}
    #hud .badge span {{ color: #aaa; }}
    #hud .badge strong {{ color: #fff; }}
    #controls {{
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 9999;
    }}
    .ctrl-btn {{
      background: rgba(20,20,30,0.9);
      border: 1px solid #444;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }}
    .ctrl-btn:hover {{ background: #4285f4; border-color: #4285f4; }}
    .ctrl-btn.active {{ background: #ea4335; border-color: #ea4335; }}
    #energy-bar {{
      position: fixed;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 200px;
      background: #111;
      border-radius: 3px;
      overflow: hidden;
      z-index: 9999;
    }}
    #energy-fill {{
      position: absolute;
      bottom: 0;
      width: 100%;
      background: linear-gradient(to top, #34a853, #fbbc05, #ea4335);
      transition: height 0.05s;
    }}
  </style>
</head>
<body>

<div id="hud">
  <div class="logo">🌍 Antigravity Claw</div>
  <div class="badge"><span>mode: </span><strong id="hud-mode">{mode}</strong></div>
  <div class="badge"><span>tick: </span><strong id="hud-tick">0</strong></div>
  <div class="badge"><span>time: </span><strong id="hud-time">0.00s</strong></div>
  <div class="badge"><span>elements: </span><strong id="hud-elems">0</strong></div>
  <div class="badge"><span>energy: </span><strong id="hud-energy">0</strong></div>
  <div class="badge"><span>url: </span><strong style="color:#4285f4">{url}</strong></div>
</div>

<div id="energy-bar"><div id="energy-fill" style="height:0%"></div></div>

<div id="canvas-wrap">
  <!-- Elements injected by JS -->
</div>

<div id="controls">
  <button class="ctrl-btn" onclick="prevFrame()">⏮ Prev</button>
  <button class="ctrl-btn" id="btn-play" onclick="togglePlay()">⏸ Pause</button>
  <button class="ctrl-btn" onclick="nextFrame()">Next ⏭</button>
  <button class="ctrl-btn" onclick="resetSim()">↺ Reset</button>
  <button class="ctrl-btn" onclick="cycleGravity()">🌀 Gravity</button>
  <button class="ctrl-btn" onclick="setSpeed(0.25)">0.25×</button>
  <button class="ctrl-btn" onclick="setSpeed(1)">1×</button>
  <button class="ctrl-btn" onclick="setSpeed(3)">3×</button>
</div>

<script>
const FRAMES   = {frames_json};
const ELEMENTS = {elements_json};
const CANVAS_W = 1280;
const CANVAS_H = 800;

let currentFrame = 0;
let playing      = true;
let speed        = 1;
let lastTime     = null;
const FPS        = 60;
const FRAME_MS   = 1000 / FPS;

// Build DOM elements
const wrap = document.getElementById('canvas-wrap');
const domEls = {{}};

ELEMENTS.forEach(el => {{
  const div = document.createElement('div');
  div.id = 'phys-' + el.id;
  div.className = 'phys-elem tag-' + el.tag;

  // Special Google logo coloring
  if (el.id.startsWith('logo-')) {{
    const letter = el.id.split('-')[1];
    div.classList.add('google-logo');
    const colors = {{G:'#4285f4', o1:'#ea4335', o2:'#fbbc05', g:'#4285f4', l:'#34a853', e:'#ea4335'}};
    div.style.color = colors[letter] || '#1a1a1a';
    div.style.fontSize = '64px';
    div.style.fontWeight = 'bold';
  }}

  div.style.width  = el.width  + 'px';
  div.style.height = el.height + 'px';
  div.style.left   = el.origin.x + 'px';
  div.style.top    = el.origin.y + 'px';

  // Content
  if (el.tag === 'img') {{
    div.textContent = '🖼';
    div.style.fontSize = '32px';
  }} else if (el.tag === 'input') {{
    div.innerHTML = '<span style="color:#999;font-size:14px">Search...</span>';
  }} else {{
    div.textContent = el.text || '';
  }}

  wrap.appendChild(div);
  domEls[el.id] = div;
}});

function applyFrame(idx) {{
  if (idx < 0 || idx >= FRAMES.length) return;
  const frame = FRAMES[idx];

  frame.elements.forEach(fe => {{
    const div = domEls[fe.id];
    if (!div) return;
    div.style.transform = `translate(${{fe.x - parseFloat(div.dataset.ox || fe.x)}}px, ${{fe.y - parseFloat(div.dataset.oy || fe.y)}}px) rotate(${{fe.rotation.toFixed(2)}}deg)`;
    div.style.left = fe.x + 'px';
    div.style.top  = fe.y + 'px';
    div.style.transform = `rotate(${{fe.rotation.toFixed(2)}}deg)`;
    if (fe.grounded) div.classList.add('grounded');
    else div.classList.remove('grounded');
  }});

  // HUD
  document.getElementById('hud-tick').textContent   = frame.tick;
  document.getElementById('hud-time').textContent   = frame.time_secs.toFixed(2) + 's';
  document.getElementById('hud-elems').textContent  = frame.elements.length;
  document.getElementById('hud-energy').textContent = Math.round(frame.total_energy);

  const maxE = 50000;
  const pct  = Math.min(frame.total_energy / maxE * 100, 100);
  document.getElementById('energy-fill').style.height = pct + '%';
}}

function togglePlay() {{
  playing = !playing;
  document.getElementById('btn-play').textContent = playing ? '⏸ Pause' : '▶ Play';
}}
function prevFrame()    {{ currentFrame = Math.max(0, currentFrame - 1); applyFrame(currentFrame); }}
function nextFrame()    {{ currentFrame = Math.min(FRAMES.length-1, currentFrame+1); applyFrame(currentFrame); }}
function resetSim()     {{ currentFrame = 0; applyFrame(0); }}
function setSpeed(s)    {{ speed = s; }}
function cycleGravity() {{ alert('Gravity direction can be changed via CLI with --mode flag'); }}

let accum = 0;
function loop(ts) {{
  if (lastTime !== null && playing) {{
    accum += (ts - lastTime) * speed;
    while (accum >= FRAME_MS) {{
      currentFrame = (currentFrame + 1) % FRAMES.length;
      applyFrame(currentFrame);
      accum -= FRAME_MS;
    }}
  }}
  lastTime = ts;
  requestAnimationFrame(loop);
}}

applyFrame(0);
requestAnimationFrame(loop);
</script>
</body>
</html>"#,
        url = url,
        mode = mode,
        frames_json = frames_json,
        elements_json = elements_json,
    )
}

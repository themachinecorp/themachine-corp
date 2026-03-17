// main.rs — Antigravity Claw CLI

mod physics;
mod renderer;
mod scraper;
mod types;

use anyhow::Result;
use clap::{Parser, Subcommand, ValueEnum};
use colored::*;
use std::time::Duration;
use tokio::time::sleep;
use tracing_subscriber::EnvFilter;

use physics::{simulate, step, apply_initial_impulse, reset};
use renderer::{init_terminal, render_terminal, restore_terminal, render_html};
use scraper::{fetch_and_build_world, build_google_world};
use types::{GravityMode, SimFrame};

#[derive(Parser)]
#[command(
    name = "antigravity",
    about = "🌍 Antigravity Claw — make any webpage defy gravity",
    version = "1.0.0",
    long_about = "Fetches a URL, extracts DOM elements, runs a 2D physics simulation,\n\
                  and renders the result as an interactive HTML animation or live terminal display."
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Apply gravity to a webpage and watch it fall apart
    Drop {
        /// URL to apply gravity to (default: Google)
        #[arg(default_value = "https://www.google.com")]
        url: String,

        /// Gravity direction
        #[arg(short, long, default_value = "down")]
        mode: GravMode,

        /// Simulation duration in seconds
        #[arg(short, long, default_value_t = 5.0)]
        duration: f64,

        /// Output HTML file (if not set, show terminal animation)
        #[arg(short, long)]
        output: Option<String>,

        /// Frames per second for simulation
        #[arg(long, default_value_t = 60)]
        fps: u32,

        /// Use built-in Google mock (no HTTP fetch needed)
        #[arg(long)]
        demo: bool,
    },

    /// Run the classic `import antigravity` experience in terminal
    Fly,

    /// Simulate gravity in the terminal (live animation)
    Watch {
        /// URL to watch (default: Google demo)
        #[arg(default_value = "https://www.google.com")]
        url: String,

        /// Gravity direction
        #[arg(short, long, default_value = "down")]
        mode: GravMode,

        /// Use built-in Google mock
        #[arg(long)]
        demo: bool,
    },

    /// Export simulation as JSON frames
    Export {
        /// URL to simulate
        #[arg(default_value = "https://www.google.com")]
        url: String,

        /// Gravity direction
        #[arg(short, long, default_value = "down")]
        mode: GravMode,

        /// Duration in seconds
        #[arg(short, long, default_value_t = 3.0)]
        duration: f64,

        /// Output JSON file
        #[arg(short, long, default_value = "frames.json")]
        output: String,

        /// Use built-in Google mock
        #[arg(long)]
        demo: bool,
    },
}

#[derive(ValueEnum, Clone, Debug)]
enum GravMode {
    Down, Up, Left, Right, Zero, Chaos,
}

impl From<GravMode> for GravityMode {
    fn from(m: GravMode) -> Self {
        match m {
            GravMode::Down  => GravityMode::Down,
            GravMode::Up    => GravityMode::Up,
            GravMode::Left  => GravityMode::Left,
            GravMode::Right => GravityMode::Right,
            GravMode::Zero  => GravityMode::Zero,
            GravMode::Chaos => GravityMode::Chaos,
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_env("ANTIGRAVITY_LOG")
                .unwrap_or_else(|_| EnvFilter::new("warn")),
        )
        .without_time()
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Fly => cmd_fly(),

        Commands::Drop { url, mode, duration, output, fps, demo } => {
            cmd_drop(url, mode.into(), duration, output, fps, demo).await?;
        }

        Commands::Watch { url, mode, demo } => {
            cmd_watch(url, mode.into(), demo).await?;
        }

        Commands::Export { url, mode, duration, output, demo } => {
            cmd_export(url, mode.into(), duration, output, demo).await?;
        }
    }

    Ok(())
}

/// The classic `import antigravity` easter egg — terminal edition
fn cmd_fly() {
    println!();
    println!("{}", "  ┌─────────────────────────────────────────────────────┐".bright_blue());
    println!("{}", "  │                                                     │".bright_blue());
    println!("{}", "  │   import antigravity                                │".bright_blue());
    println!("{}", "  │                                                     │".bright_blue());
    println!("{}", "  │   This module lets you fly.                         │".bright_blue());
    println!("{}", "  │                                                     │".bright_blue());
    println!("{}", "  │   XKCD #353 — Python (2008)                        │".bright_blue());
    println!("{}", "  │   Google App Engine Easter Egg (2008)               │".bright_blue());
    println!("{}", "  │   Python 3 stdlib module (since 3.0)               │".bright_blue());
    println!("{}", "  │                                                     │".bright_blue());
    println!("{}", "  └─────────────────────────────────────────────────────┘".bright_blue());
    println!();
    println!("{}", "        o        o        o".bright_yellow());
    println!("{}", "       /|\\      /|\\      /|\\".bright_yellow());
    println!("{}", "       / \\      / \\      / \\".bright_yellow());
    println!();
    println!("{}", "  You're flying! Gravity? Never heard of it.".bright_green().bold());
    println!();
    println!("  The secret: {}",
        "import antigravity # opens xkcd.com/353".bright_cyan());
    println!("  Google Gravity easter egg: {}",
        "https://elgoog.im/gravity/".bright_cyan());
    println!("  Google Antigravity IDE: {}",
        "https://antigravity.dev".bright_cyan());
    println!();

    // ASCII animation — character flying upward
    let frames = [
        "        o\n       /|\\\n       / \\\n",
        "      o\n     /|\\\n     / \\\n",
        "    o\n   /|\\\n   / \\\n",
        "  o\n /|\\\n / \\\n",
        " o ~\n/|\\\n/ \\\n",
        "o ~ ~\n|\\\n \\\n",
        "~ ~ ~\n",
    ];
    for f in &frames {
        print!("\x1b[3A\x1b[J{}", f);
        std::thread::sleep(Duration::from_millis(180));
    }

    println!("\n  {}", "🚀 You have achieved antigravity!".bright_green().bold());
    println!();
}

/// Drop a webpage — simulate physics and output HTML or terminal
async fn cmd_drop(
    url: String,
    mode: GravityMode,
    duration: f64,
    output: Option<String>,
    fps: u32,
    demo: bool,
) -> Result<()> {
    println!("{}", "\n🌍 Antigravity Claw — Drop".bright_cyan().bold());
    println!("   URL:  {}", url.bright_white());
    println!("   Mode: {}", format!("{}", mode).bright_magenta());
    println!("   Dur:  {}s @ {}fps\n", duration, fps);

    let mut world = if demo {
        println!("{}", "   Using built-in Google demo...".dim());
        build_google_world(mode)
    } else {
        println!("{}", "   Fetching page...".dim());
        match fetch_and_build_world(&url, mode).await {
            Ok(w) => w,
            Err(e) => {
                println!("{}", format!("   ⚠  Fetch failed ({}) — using Google demo", e).yellow());
                build_google_world(GravityMode::Down)
            }
        }
    };

    println!("{}", "   Running physics simulation...".dim());
    let frames = simulate(&mut world, duration, fps);
    println!("   {} frames generated", frames.len().to_string().bright_green());

    match output {
        Some(ref path) => {
            let html = render_html(&world, &frames);
            std::fs::write(path, html)?;
            println!("\n{}", format!("✅ Saved: {}", path).green().bold());
            println!("   Open in your browser to watch the physics animation!");
        }
        None => {
            // Print summary stats
            let last = frames.last();
            if let Some(f) = last {
                println!("\n   Final energy: {:.0}", f.total_energy);
                let grounded = f.elements.iter().filter(|e| e.grounded).count();
                println!("   Grounded elements: {}/{}", grounded, f.elements.len());
            }
            println!("\n   Tip: add --output result.html to get an interactive animation");
        }
    }

    Ok(())
}

/// Live terminal animation
async fn cmd_watch(url: String, mode: GravityMode, demo: bool) -> Result<()> {
    println!("{}", "🌍 Building world...".bright_cyan());

    let mut world = if demo {
        build_google_world(mode)
    } else {
        match fetch_and_build_world(&url, mode).await {
            Ok(w) => w,
            Err(e) => {
                println!("{}", format!("⚠  Fetch failed ({}) — using demo", e).yellow());
                build_google_world(GravityMode::Down)
            }
        }
    };

    apply_initial_impulse(&mut world);
    init_terminal();

    let fps = 30u32;
    let frame_dur = Duration::from_millis(1000 / fps as u64);

    println!("{}", "   Press Ctrl+C to exit\n".dim());

    for tick in 0..600u64 {
        let dt = 1.0 / fps as f64;
        step(&mut world, dt);

        let energy: f64 = world.elements.iter().map(|e| e.kinetic_energy()).sum();
        let frame = types::SimFrame {
            tick,
            time_secs: tick as f64 * dt,
            elements: world.elements.iter().map(|e| types::FrameElement {
                id:       e.id.clone(),
                x:        e.position.x,
                y:        e.position.y,
                vx:       e.velocity.x,
                vy:       e.velocity.y,
                rotation: e.rotation,
                grounded: e.grounded,
            }).collect(),
            total_energy: energy,
        };

        render_terminal(&world, &frame);
        sleep(frame_dur).await;
    }

    restore_terminal();
    Ok(())
}

/// Export simulation frames to JSON
async fn cmd_export(
    url: String,
    mode: GravityMode,
    duration: f64,
    output: String,
    demo: bool,
) -> Result<()> {
    println!("{}", "🌍 Antigravity Claw — Export".bright_cyan().bold());

    let mut world = if demo {
        build_google_world(mode)
    } else {
        fetch_and_build_world(&url, mode).await
            .unwrap_or_else(|_| build_google_world(GravityMode::Down))
    };

    let frames = simulate(&mut world, duration, 60);
    let json = serde_json::to_string_pretty(&frames)?;
    std::fs::write(&output, json)?;

    println!("✅ Exported {} frames to {}", frames.len(), output.bright_green());
    Ok(())
}

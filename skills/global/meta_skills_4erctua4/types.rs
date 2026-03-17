// types.rs — Core data structures for Antigravity Claw

use serde::{Deserialize, Serialize};

/// A 2D vector used for position and velocity
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Vec2 {
    pub x: f64,
    pub y: f64,
}

impl Vec2 {
    pub fn new(x: f64, y: f64) -> Self { Self { x, y } }
    pub fn zero() -> Self { Self { x: 0.0, y: 0.0 } }

    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn add(&self, other: Vec2) -> Vec2 {
        Vec2::new(self.x + other.x, self.y + other.y)
    }

    pub fn scale(&self, s: f64) -> Vec2 {
        Vec2::new(self.x * s, self.y * s)
    }
}

/// A DOM element extracted from a webpage with physics properties
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicsElement {
    pub id: String,
    pub tag: String,
    pub text: String,
    /// Original position (px from top-left)
    pub origin: Vec2,
    /// Current simulated position
    pub position: Vec2,
    /// Current velocity
    pub velocity: Vec2,
    /// Mass (proportional to bounding box area)
    pub mass: f64,
    /// Width and height in pixels
    pub width: f64,
    pub height: f64,
    /// Is element currently on the ground
    pub grounded: bool,
    /// Rotation in degrees
    pub rotation: f64,
    /// Angular velocity
    pub angular_velocity: f64,
    /// Coefficient of restitution (bounciness 0..1)
    pub restitution: f64,
    /// Friction coefficient
    pub friction: f64,
}

impl PhysicsElement {
    pub fn new(id: &str, tag: &str, text: &str, x: f64, y: f64, w: f64, h: f64) -> Self {
        let area = (w * h).max(1.0);
        Self {
            id: id.to_string(),
            tag: tag.to_string(),
            text: text.chars().take(60).collect(),
            origin: Vec2::new(x, y),
            position: Vec2::new(x, y),
            velocity: Vec2::zero(),
            mass: (area / 1000.0).max(0.5).min(20.0),
            width: w,
            height: h,
            grounded: false,
            rotation: 0.0,
            angular_velocity: 0.0,
            restitution: 0.3,
            friction: 0.85,
        }
    }

    pub fn kinetic_energy(&self) -> f64 {
        0.5 * self.mass * self.velocity.length().powi(2)
    }
}

/// The full page physics state
#[derive(Debug, Serialize, Deserialize)]
pub struct PhysicsWorld {
    pub url: String,
    pub viewport_width: f64,
    pub viewport_height: f64,
    pub gravity: f64,
    pub elements: Vec<PhysicsElement>,
    pub tick: u64,
    pub mode: GravityMode,
}

impl PhysicsWorld {
    pub fn new(url: &str, w: f64, h: f64) -> Self {
        Self {
            url: url.to_string(),
            viewport_width: w,
            viewport_height: h,
            gravity: 980.0, // px/s² (close to real 9.8 m/s², scaled)
            elements: vec![],
            tick: 0,
            mode: GravityMode::Down,
        }
    }
}

/// Direction of gravity for the simulation
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GravityMode {
    Down,
    Up,
    Left,
    Right,
    Zero,
    Chaos,
}

impl std::fmt::Display for GravityMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GravityMode::Down  => write!(f, "down"),
            GravityMode::Up    => write!(f, "up"),
            GravityMode::Left  => write!(f, "left"),
            GravityMode::Right => write!(f, "right"),
            GravityMode::Zero  => write!(f, "zero"),
            GravityMode::Chaos => write!(f, "chaos"),
        }
    }
}

/// Output snapshot for one simulation frame
#[derive(Debug, Serialize, Deserialize)]
pub struct SimFrame {
    pub tick: u64,
    pub time_secs: f64,
    pub elements: Vec<FrameElement>,
    pub total_energy: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FrameElement {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub vx: f64,
    pub vy: f64,
    pub rotation: f64,
    pub grounded: bool,
}

/// Config for a full antigravity run
#[derive(Debug, Serialize, Deserialize)]
pub struct AntigravityConfig {
    pub url: String,
    pub mode: GravityMode,
    pub duration_secs: f64,
    pub fps: u32,
    pub output_html: Option<String>,
    pub output_json: Option<String>,
}

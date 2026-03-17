// scraper.rs — HTTP scraper: fetch a URL and extract layout elements

use anyhow::Result;
use serde_json::Value;
use tracing::{debug, info, warn};

use crate::types::*;

/// Fetch a page and build a PhysicsWorld from its layout.
/// Uses a headless-friendly approach: fetch HTML, extract elements,
/// assign estimated positions and sizes.
pub async fn fetch_and_build_world(url: &str, mode: GravityMode) -> Result<PhysicsWorld> {
    info!("Fetching: {}", url);

    let client = reqwest::Client::builder()
        .user_agent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
             AppleWebKit/537.36 (KHTML, like Gecko) \
             Chrome/122.0.0.0 Safari/537.36",
        )
        .timeout(std::time::Duration::from_secs(15))
        .build()?;

    let html = client.get(url).send().await?.text().await?;
    info!("Fetched {} bytes of HTML", html.len());

    let mut world = PhysicsWorld::new(url, 1280.0, 800.0);
    world.mode = mode;

    let elements = parse_elements_from_html(&html);
    info!("Extracted {} physics elements", elements.len());
    world.elements = elements;

    Ok(world)
}

/// Parse HTML text into positioned PhysicsElements.
/// Uses heuristic layout estimation (no real browser rendering).
fn parse_elements_from_html(html: &str) -> Vec<PhysicsElement> {
    let mut elements = Vec::new();
    let mut id = 0usize;

    // Strip script/style blocks
    let clean = strip_scripts(html);

    // Extract tags we care about
    let tags_of_interest = [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "a", "button", "input", "img",
        "div", "span", "header", "nav", "footer",
        "li", "td", "th", "form", "label",
    ];

    // Flow layout simulation: track current Y cursor
    let mut cursor_y = 60.0_f64;
    let viewport_w = 1280.0_f64;
    let margin = 40.0_f64;

    let mut pos = 0usize;
    while pos < clean.len() {
        // Find next opening tag
        if let Some(open_start) = clean[pos..].find('<') {
            let abs_start = pos + open_start;
            if let Some(open_end) = clean[abs_start..].find('>') {
                let tag_content = &clean[abs_start + 1..abs_start + open_end];
                // Skip closing tags and comments
                if tag_content.starts_with('/') || tag_content.starts_with('!') {
                    pos = abs_start + open_end + 1;
                    continue;
                }

                let tag_name = tag_content
                    .split_whitespace()
                    .next()
                    .unwrap_or("")
                    .to_lowercase();
                let tag_name = tag_name.trim_end_matches('/');

                if tags_of_interest.contains(&tag_name) {
                    // Get inner text up to closing tag
                    let close_tag = format!("</{}", tag_name);
                    let text_start = abs_start + open_end + 1;
                    let text_end = clean[text_start..]
                        .find(&close_tag)
                        .map(|i| text_start + i)
                        .unwrap_or(text_start.min(text_start + 200));

                    let raw_text = &clean[text_start..text_end.min(clean.len())];
                    let text = strip_tags(raw_text).trim().to_string();

                    if text.len() < 2 {
                        pos = abs_start + open_end + 1;
                        continue;
                    }

                    // Estimate element dimensions based on tag type
                    let (w, h) = estimate_size(&tag_name, &text, viewport_w, margin);

                    let elem = PhysicsElement::new(
                        &format!("el-{}", id),
                        tag_name,
                        &text,
                        margin + rand_offset(id),
                        cursor_y,
                        w,
                        h,
                    );

                    cursor_y += h + 8.0;
                    if cursor_y > 780.0 {
                        cursor_y = 60.0; // wrap (simplified)
                    }

                    elements.push(elem);
                    id += 1;

                    if elements.len() >= 120 {
                        break;
                    }
                }

                pos = abs_start + open_end + 1;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // Inject Google-specific elements if URL contains google.com
    elements
}

fn estimate_size(tag: &str, text: &str, vw: f64, margin: f64) -> (f64, f64) {
    let char_w = 8.0_f64;
    let available = vw - margin * 2.0;

    match tag {
        "h1"                    => (available.min(text.len() as f64 * 14.0 + 20.0), 48.0),
        "h2"                    => (available.min(text.len() as f64 * 12.0 + 20.0), 38.0),
        "h3" | "h4"             => (available.min(text.len() as f64 * 10.0 + 20.0), 30.0),
        "button"                => ((text.len() as f64 * char_w + 32.0).min(200.0), 36.0),
        "input"                 => (240.0, 36.0),
        "img"                   => (200.0, 120.0),
        "a"                     => ((text.len() as f64 * char_w).min(available), 20.0),
        "li"                    => (available.min(text.len() as f64 * char_w + 20.0), 24.0),
        "td" | "th"             => (120.0, 28.0),
        "nav" | "header"        => (available, 56.0),
        "footer"                => (available, 60.0),
        _                       => {
            let w = (text.len() as f64 * char_w).min(available);
            let lines = (text.len() as f64 * char_w / available).ceil().max(1.0);
            (w, (lines * 20.0 + 8.0).min(120.0))
        }
    }
}

fn rand_offset(seed: usize) -> f64 {
    // Deterministic pseudo-random offset from seed
    ((seed * 2654435761) % 61) as f64
}

fn strip_scripts(html: &str) -> String {
    let mut result = String::with_capacity(html.len());
    let mut i = 0usize;
    let bytes = html.as_bytes();

    while i < bytes.len() {
        // Find <script or <style
        if html[i..].to_lowercase().starts_with("<script")
            || html[i..].to_lowercase().starts_with("<style")
        {
            // Skip until closing tag
            let close = if html[i..].to_lowercase().starts_with("<script") {
                "</script>"
            } else {
                "</style>"
            };
            if let Some(end) = html[i..].to_lowercase().find(close) {
                i += end + close.len();
            } else {
                break;
            }
        } else {
            result.push(bytes[i] as char);
            i += 1;
        }
    }

    result
}

fn strip_tags(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => result.push(ch),
            _ => {}
        }
    }
    // Decode basic HTML entities
    result
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
}

/// Build a Google.com mock world (used as demo when no URL is given)
pub fn build_google_world(mode: GravityMode) -> PhysicsWorld {
    let mut world = PhysicsWorld::new("https://www.google.com", 1280.0, 800.0);
    world.mode = mode;

    let google_elements = vec![
        // Google logo letters
        ("logo-G",    "span", "G",                    490.0,  320.0,  62.0, 72.0),
        ("logo-o1",   "span", "o",                    552.0,  328.0,  54.0, 64.0),
        ("logo-o2",   "span", "o",                    606.0,  328.0,  54.0, 64.0),
        ("logo-g",    "span", "g",                    660.0,  328.0,  54.0, 64.0),
        ("logo-l",    "span", "l",                    714.0,  320.0,  32.0, 72.0),
        ("logo-e",    "span", "e",                    746.0,  328.0,  54.0, 64.0),
        // Search bar
        ("searchbar", "input", "",                     342.0,  420.0, 580.0, 44.0),
        ("search-btn","button","Google Search",        440.0,  490.0, 138.0, 36.0),
        ("lucky-btn", "button","I'm Feeling Lucky",   590.0,  490.0, 162.0, 36.0),
        // Top nav
        ("nav-gmail", "a",    "Gmail",                 876.0,   14.0,  44.0, 18.0),
        ("nav-images","a",    "Images",                928.0,   14.0,  54.0, 18.0),
        ("nav-apps",  "button","⋮",                   1210.0,   6.0,  36.0, 36.0),
        ("nav-signin","button","Sign in",             1222.0,  60.0,   80.0, 32.0),
        // Bottom links
        ("footer-adv","a",    "Advertising",            88.0, 760.0,   80.0, 16.0),
        ("footer-biz","a",    "Business",              184.0, 760.0,   60.0, 16.0),
        ("footer-how","a",    "How Search works",      256.0, 760.0,  120.0, 16.0),
        ("footer-priv","a",   "Privacy",               634.0, 760.0,   52.0, 16.0),
        ("footer-terms","a",  "Terms",                 698.0, 760.0,   44.0, 16.0),
        ("footer-set","a",    "Settings",              752.0, 760.0,   56.0, 16.0),
    ];

    for (id, tag, text, x, y, w, h) in google_elements {
        world.elements.push(PhysicsElement::new(id, tag, text, x, y, w, h));
    }

    world
}

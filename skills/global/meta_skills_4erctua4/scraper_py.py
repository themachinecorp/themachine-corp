"""
scraper_py.py — Python-side DOM scraper for Antigravity Claw
Uses BeautifulSoup to extract elements with estimated layout positions.
Falls back to Rust's built-in scraper when called via CLI.
"""

import json
import re
from dataclasses import dataclass, asdict
from typing import Optional
import httpx
from bs4 import BeautifulSoup


@dataclass
class Element:
    id: str
    tag: str
    text: str
    x: float
    y: float
    width: float
    height: float
    origin_x: float
    origin_y: float


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}

TAGS_OF_INTEREST = {
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "button", "input", "img",
    "div", "span", "header", "nav", "footer",
    "li", "td", "th", "label",
}

ESTIMATED_SIZES = {
    "h1":     (None, 48),
    "h2":     (None, 38),
    "h3":     (None, 30),
    "h4":     (None, 26),
    "button": (160,  36),
    "input":  (260,  36),
    "img":    (200, 120),
    "a":      (None, 20),
    "li":     (None, 24),
    "td":     (120,  28),
    "th":     (120,  32),
    "nav":    (None, 56),
    "header": (None, 60),
    "footer": (None, 60),
}


def scrape(url: str, viewport_w: int = 1280, viewport_h: int = 800) -> list[Element]:
    """Fetch a URL and extract positioned elements."""
    resp = httpx.get(url, headers=HEADERS, timeout=15, follow_redirects=True)
    resp.raise_for_status()
    return parse_html(resp.text, viewport_w, viewport_h)


def parse_html(html: str, vw: int = 1280, vh: int = 800) -> list[Element]:
    """Parse HTML into positioned elements using flow layout heuristics."""
    soup = BeautifulSoup(html, "lxml")

    # Remove scripts and styles
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    elements = []
    cursor_y = 60.0
    margin = 40.0
    available_w = vw - margin * 2

    for i, tag in enumerate(soup.find_all(True)):
        name = tag.name.lower() if tag.name else ""
        if name not in TAGS_OF_INTEREST:
            continue

        text = tag.get_text(" ", strip=True)
        if len(text) < 2:
            continue

        # Estimate size
        preset = ESTIMATED_SIZES.get(name, (None, 20))
        text_w = len(text) * 8.0
        w = float(preset[0]) if preset[0] else min(text_w + 20, available_w)
        h = float(preset[1])
        w = min(w, available_w)

        x = margin + (i * 17) % 60  # slight stagger
        y = cursor_y

        elem = Element(
            id=f"el-{i}",
            tag=name,
            text=text[:80],
            x=x, y=y,
            width=w, height=h,
            origin_x=x, origin_y=y,
        )
        elements.append(elem)

        cursor_y += h + 8.0
        if cursor_y > vh - 80:
            cursor_y = 60.0

        if len(elements) >= 150:
            break

    return elements


def to_json(elements: list[Element]) -> str:
    return json.dumps([asdict(e) for e in elements], indent=2)


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.google.com"
    elems = scrape(url)
    print(f"Extracted {len(elems)} elements from {url}")
    for e in elems[:5]:
        print(f"  [{e.tag:8}] {e.text[:40]:<40} @ ({e.x:.0f}, {e.y:.0f})")

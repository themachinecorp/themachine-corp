#!/usr/bin/env python3
"""Post to X using Playwright browser automation."""
import asyncio
import sys
from pathlib import Path

async def post_to_x(content: str):
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.contexts[0]
        page = await context.new_page()
        
        await page.goto("https://x.com/compose/post")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)
        
        # Find and fill the text area
        await page.locator('[contenteditable="true"]').first.fill(content)
        await asyncio.sleep(1)
        
        # Click post button
        await page.locator('[data-testid="tweetButton"]').click()
        await asyncio.sleep(3)
        
        url = page.url
        await browser.close()
        return url

if __name__ == "__main__":
    post_file = Path("/tmp/post_content.txt")
    if not post_file.exists():
        print("ERROR: /tmp/post_content.txt not found")
        sys.exit(1)
    
    content = post_file.read_text().strip()
    if not content:
        print("ERROR: empty content")
        sys.exit(1)
    
    url = asyncio.run(post_to_x(content))
    print(f"POSTED: {url}")

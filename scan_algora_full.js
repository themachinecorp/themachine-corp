const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('=== SCANNING Algora.io ===');
  await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Scroll multiple times to load more
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  // Get all bounty cards with details
  const bounties = await page.evaluate(() => {
    const results = [];
    // Try multiple selectors
    const cards = document.querySelectorAll('[class*="bounty"], [class*="card"], article, [class*="issue"]');
    const links = document.querySelectorAll('a[href*="/bounty"], a[href*="/issue"]');

    // Get page text and find bounty-like patterns
    const body = document.body.innerText;

    // Try to find bounty items from list items or divs
    const items = document.querySelectorAll('div[class*="flex"], div[class*="grid"]');
    for (const item of items) {
      const text = item.innerText || '';
      if (text.includes('$') && text.includes('\n') && text.length < 500 && text.length > 30) {
        const rect = item.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 30 && rect.top > 0) {
          results.push({
            text: text.trim().substring(0, 400),
            top: rect.top
          });
        }
      }
    }
    return results;
  });

  console.log(`Found ${bounties.length} potential bounty items`);
  const seen = new Set();
  for (const b of bounties) {
    const key = b.text.substring(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      console.log('\n--- BOUNTY ---');
      console.log(b.text);
    }
  }

  await page.screenshot({ path: 'algora_bounties_full.png', fullPage: true });
  console.log('\nScreenshot saved');

  await browser.close();
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });

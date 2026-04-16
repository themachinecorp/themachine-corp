const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('=== DEEP SCAN Algora.io ===');
  await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);

  // Scroll multiple times
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2500);
    console.log(`Scroll ${i+1}/8 done`);
  }

  // Get all text content and parse for bounties
  const allBounties = await page.evaluate(() => {
    const results = [];
    // Look for elements with $ amounts
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.innerText || '';
      // Match patterns like $5,000 or $500
      const dollarMatch = text.match(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
      if (dollarMatch && text.includes('\n') && text.length > 20 && text.length < 600) {
        const rect = div.getBoundingClientRect();
        if (rect.width > 150 && rect.height > 30 && rect.top > 0 && rect.top < 10000) {
          results.push({
            text: text.trim().replace(/\n+/g, ' | ').substring(0, 500),
            top: Math.round(rect.top)
          });
        }
      }
    }
    return results;
  });

  // Deduplicate and print
  const seen = new Set();
  let count = 0;
  for (const b of allBounties.sort((a, c) => a.top - c.top)) {
    const key = b.text.substring(0, 100);
    if (!seen.has(key) && count < 60) {
      seen.add(key);
      count++;
      console.log(`\n[${count}] (top=${b.top}): ${b.text}`);
    }
  }

  await page.screenshot({ path: 'algora_deep_scan.png', fullPage: true });
  console.log('\n=== SCREENSHOT SAVED ===');

  await browser.close();
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });

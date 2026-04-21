const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Algora
  await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Scroll to load more
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  
  // Try to find bounty cards
  const cards = await page.evaluate(() => {
    const results = [];
    const dollarRegex = /\$[0-9,]+/;
    const allElements = document.querySelectorAll('div, article, li, a');
    for (const el of allElements) {
      const text = el.textContent || '';
      if (dollarRegex.test(text) && text.length < 300 && text.length > 10) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 20) {
          results.push(text.trim().replace(/\s+/g, ' ').substring(0, 200));
        }
      }
    }
    return results;
  });
  
  console.log('=== ALGORA CARDS ===');
  cards.slice(0, 60).forEach(c => console.log(c));
  console.log('=== END ===');
  
  await page.screenshot({ path: 'algora_scan_full.png', fullPage: true });
  console.log('Screenshot saved to algora_scan_full.png');
  
  await browser.close();
})().catch(e => { console.error('ERROR:' + e.message); process.exit(1); });

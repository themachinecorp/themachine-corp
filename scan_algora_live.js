const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('Scanning Algora.io...');
  await page.goto('https://algora.io/bounties', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Scroll to load content
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
  }

  // Extract bounty info
  const bounties = await page.evaluate(() => {
    const results = [];
    // Look for bounty cards
    const cards = document.querySelectorAll('[class*="bounty"], [class*="card"], article, div[class*="grid"] > div');
    cards.forEach(card => {
      const text = card.innerText || '';
      const hasDollar = /\$[0-9,]+/.test(text);
      const hasRepo = /github\.com\/[\w-]+\/[\w-]+/.test(text);
      if (hasDollar && text.length < 500 && text.length > 20) {
        results.push(text.trim().substring(0, 300));
      }
    });
    return results;
  });

  console.log(`Found ${bounties.length} bounty candidates`);
  bounties.slice(0, 20).forEach((b, i) => {
    console.log(`\n--- Bounty ${i+1} ---`);
    console.log(b.substring(0, 250));
  });

  // Also try to get links to specific bounties
  const bountyLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('a[href*="/bounty/"]').forEach(a => {
      links.push(a.href);
    });
    return [...new Set(links)].slice(0, 10);
  });

  console.log('\n=== Bounty Links ===');
  bountyLinks.forEach(l => console.log(l));

  await page.screenshot({ path: '/tmp/algora_live.png', fullPage: true });
  console.log('\nScreenshot: /tmp/algora_live.png');

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

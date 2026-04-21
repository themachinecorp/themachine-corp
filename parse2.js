const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 4000 } });
  
  await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Look for bounty cards/rows using data attributes or specific selectors
  const bountySelectors = [
    'a[href*="/bounty/"]',
    'div[class*="bounty"]',
    'article',
    '[class*="cursor-pointer"]',
  ];
  
  for (const sel of bountySelectors) {
    const count = await page.locator(sel).count();
    console.log(`Selector "${sel}": ${count} elements`);
  }
  
  // Try getting all links
  const links = await page.$$eval('a', els => 
    els.filter(el => el.href.includes('bounty') || el.href.includes('issue'))
       .map(el => ({ href: el.href, text: el.innerText.trim().slice(0,100) }))
       .slice(0, 30)
  );
  console.log('\nBounty links:', JSON.stringify(links, null, 2));
  
  await browser.close();
})();

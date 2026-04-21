const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  const results = { algora: [], bountyNew: [], errors: [] };
  
  // ── ALGORA ──
  try {
    console.log('[Algora] Navigating...');
    await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'algora_scan_0403.png' });
    
    // Try to extract bounty cards
    const bounties = await page.$$eval('[class*="bounty"], [class*="card"]', els => 
      els.map(el => {
        const text = el.innerText || '';
        const priceMatch = text.match(/\$\d+/);
        return {
          text: text.slice(0, 200),
          price: priceMatch ? priceMatch[0] : null
        };
      }).filter(x => x.price)
    );
    
    results.algora = bounties;
    console.log('[Algora] Found', bounties.length, 'bounties with prices');
    
    // Try to get more structured data
    const pageText = await page.innerText('body');
    console.log('[Algora] Page text snippet:', pageText.slice(0, 500));
    
  } catch (e) {
    results.errors.push('Algora: ' + e.message);
    console.log('[Algora] Error:', e.message);
  }
  
  // ── BOUNTY.NEW ──
  try {
    console.log('[Bounty.new] Navigating...');
    await page.goto('https://bounty.new/bounties', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'bounty_new_scan_0403.png' });
    
    const bounties = await page.$$eval('[class*="bounty"], [class*="card"], [class*="item"]', els => 
      els.map(el => {
        const text = el.innerText || '';
        const priceMatch = text.match(/\$\d+/);
        return {
          text: text.slice(0, 200),
          price: priceMatch ? priceMatch[0] : null
        };
      }).filter(x => x.price)
    );
    
    results.bountyNew = bounties;
    console.log('[Bounty.new] Found', bounties.length, 'bounties with prices');
    
  } catch (e) {
    results.errors.push('Bounty.new: ' + e.message);
    console.log('[Bounty.new] Error:', e.message);
  }
  
  await browser.close();
  
  // Write results
  const fs = require('fs');
  fs.writeFileSync('kevin_scan_0403.json', JSON.stringify(results, null, 2));
  console.log('Done!');
})();

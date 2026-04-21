const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  
  console.log('🔍 Scanning Bounty.new bounties...');
  
  // Try bounty.new
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await p.goto('https://bounty.new/bounties', { waitUntil: 'networkidle', timeout: 30000 });
      break;
    } catch (e) {
      console.log(`Attempt ${attempt} failed: ${e.message}`);
      if (attempt === 3) {
        // Try main site
        await p.goto('https://bounty.new', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await p.waitForTimeout(3000);
    }
  }
  
  await p.waitForTimeout(5000);
  
  // Take screenshot
  await p.screenshot({ path: '/home/themachine/.openclaw/workspace/bounty_new_scan_2100.png', fullPage: false });
  
  // Extract bounty info
  const data = await p.evaluate(() => {
    const text = document.body.innerText;
    return { bodyText: text.substring(0, 8000) };
  });
  
  console.log('=== BOUNTY.NEW PAGE TEXT ===');
  console.log(data.bodyText);
  
  await b.close();
})();

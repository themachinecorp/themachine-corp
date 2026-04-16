const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });

  // --- Algora scan ---
  console.log('🔍 Scanning Algora.io...');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await p.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
      break;
    } catch (e) {
      console.log(`Algora attempt ${attempt} failed: ${e.message}`);
      await p.waitForTimeout(3000);
    }
  }
  await p.waitForTimeout(5000);

  // Scroll to load more
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/home/themachine/.openclaw/workspace/algora_scan_2200.png', fullPage: false });
  await p.waitForTimeout(1000);

  // Get bounty data
  const algoraData = await p.evaluate(() => {
    const items = document.querySelectorAll('[class*="bounty"], [class*="card"], [class*="item"]');
    const text = document.body.innerText;
    return { bodyText: text.substring(0, 12000) };
  });

  console.log('=== ALGORA PAGE TEXT ===');
  console.log(algoraData.bodyText);

  // --- Bounty.new scan ---
  console.log('\n🔍 Scanning Bounty.new...');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await p.goto('https://bounty.new/bounties', { waitUntil: 'networkidle', timeout: 30000 });
      break;
    } catch (e) {
      console.log(`Bounty.new attempt ${attempt} failed: ${e.message}`);
      await p.waitForTimeout(3000);
    }
  }
  await p.waitForTimeout(5000);
  await p.screenshot({ path: '/home/themachine/.openclaw/workspace/bounty_new_scan_2200.png', fullPage: false });

  const bountyNewData = await p.evaluate(() => {
    return { bodyText: document.body.innerText.substring(0, 8000) };
  });
  console.log('=== BOUNTY.NEW PAGE TEXT ===');
  console.log(bountyNewData.bodyText);

  await b.close();
  console.log('\n✅ Scan complete');
})().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});

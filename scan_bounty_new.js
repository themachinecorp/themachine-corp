const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  console.log('=== SCANNING Bounty.new ===');
  await page.goto('https://bounty.new', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body text length: ' + bodyText.length);
  console.log('\n--- Page content ---');
  console.log(bodyText.substring(0, 5000));
  
  await page.screenshot({ path: 'bounty_new_scan.png', fullPage: true });
  console.log('\nScreenshot saved to bounty_new_scan.png');

  await browser.close();
})().catch(e => { console.error('ERROR:' + e.message); process.exit(1); });

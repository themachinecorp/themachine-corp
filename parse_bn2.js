const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 4000 } });
  
  await page.goto('https://www.bounty.new/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'bounty_new_dashboard_0403.png' });
  
  const bodyText = await page.innerText('body');
  console.log('Dashboard content:\n', bodyText.slice(0, 3000));
  
  await browser.close();
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 4000 } });
  
  await page.goto('https://bounty.new', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'bounty_new_0403.png' });
  
  const bodyText = await page.innerText('body');
  console.log('Page content (first 2000):\n', bodyText.slice(0, 2000));
  
  const links = await page.$$eval('a', els => 
    els.filter(el => el.href.includes('bounty') || el.href.includes('issue'))
       .map(el => ({ href: el.href, text: el.innerText.trim().slice(0,200) }))
       .slice(0, 20)
  );
  console.log('\nLinks:', JSON.stringify(links, null, 2));
  
  await browser.close();
})();

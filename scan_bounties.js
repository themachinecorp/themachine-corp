const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // Try specific bounty pages
  const urls = [
    'https://algora.io/bounties?repo=zio/zio',
    'https://algora.io/bounties?repo=golemcloud/golem',
    'https://algora.io/bounties?repo=deskflow/deskflow'
  ];

  for (const url of urls) {
    console.log('\n=== SCANNING: ' + url + ' ===');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const cards = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('div, article, li, a, span');
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (text.length > 10 && text.length < 400) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 150 && rect.height > 15) {
            results.push({ text: text.replace(/\s+/g, ' '), w: Math.round(rect.width), h: Math.round(rect.height) });
          }
        }
      }
      return results;
    });
    
    cards.forEach(c => {
      if (c.text.includes('$') && c.w > 200) {
        console.log('[' + c.w + 'x' + c.h + '] ' + c.text.substring(0, 200));
      }
    });
  }

  // Also try the main bounties page with different params
  console.log('\n=== SCANNING: algora.io/bounties (filter=active) ===');
  await page.goto('https://algora.io/bounties?filter=active&repo=', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const bodyText = await page.evaluate(() => document.body.innerText);
  const lines = bodyText.split('\n').filter(l => l.trim().length > 5);
  lines.slice(0, 100).forEach(l => console.log(l.trim()));
  
  await browser.close();
})().catch(e => { console.error('ERROR:' + e.message); process.exit(1); });

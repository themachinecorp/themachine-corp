import { chromium } from 'playwright';

const GITHUB_TOKEN = '[REDACTED]';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      'Authorization': `token ${GITHUB_TOKEN}`
    }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to PR...');
  await page.goto('https://github.com/golemcloud/golem/pull/3106', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for page to fully load
  await page.waitForTimeout(2000);
  
  console.log('Page title:', await page.title());
  
  // Look for CLA Assistant Lite bot comment
  // Usually there's a "Checks" tab or comments section
  // Let's look for the CLA bot
  const pageContent = await page.content();
  
  // Check if we can see CLA-related content
  const claLinks = await page.$$('a[href*="cla"]');
  console.log('CLA links found:', claLinks.length);
  
  // Look for comments from cla-assistant or similar
  const allLinks = await page.$$eval('a', links => 
    links.filter(l => l.href.toLowerCase().includes('cla')).map(l => ({href: l.href, text: l.textContent?.trim().substring(0, 100)}))
  );
  console.log('Links with CLA:', JSON.stringify(allLinks, null, 2));
  
  // Check page for any text mentioning CLA
  const bodyText = await page.$eval('body', el => el.innerText.substring(0, 2000));
  console.log('Body text snippet:', bodyText);
  
  await browser.close();
})();

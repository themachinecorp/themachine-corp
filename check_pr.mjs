import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  
  // Use themachinehf session since that's the account that signed the CLA
  const page = await context.newPage();
  
  // Navigate to the PR
  await page.goto('https://github.com/golemcloud/golem/pull/3106', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Check the page title
  console.log('Title:', await page.title());
  
  // Look for merge button
  const mergeBtn = await page.$('button:has-text("Merge")');
  console.log('Merge button found:', !!mergeBtn);
  
  // Check for any blocking status
  const bodyText = await page.$eval('body', el => el.innerText);
  
  // Look for CLA status
  const claMatch = bodyText.match(/CLA.*?(signed|not signed|success|failure)/i);
  console.log('CLA status in UI:', claMatch ? claMatch[0] : 'not found');
  
  // Look for merge blocked message
  const blockedMatch = bodyText.match(/blocked|blocking|not (ready|mergeable)/i);
  console.log('Blocking status:', blockedMatch ? blockedMatch[0] : 'none');
  
  // Look for checks status
  const checksSection = await page.$('div[id="checks"]');
  console.log('Checks section found:', !!checksSection);
  
  await browser.close();
  console.log('Done');
})();

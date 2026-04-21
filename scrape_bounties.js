const { chromium } = require('playwright');

async function scrapeAlgoraFull() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Scroll to load all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('FULL PAGE TEXT:');
    console.log(bodyText);
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

scrapeAlgoraFull().catch(console.error);

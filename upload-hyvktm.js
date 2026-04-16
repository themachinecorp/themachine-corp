const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  const productId = 'hyvktm';
  const filePath = '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf';
  
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'domcontentloaded', timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  page.on('dialog', async dialog => {
    console.log(`  Dialog: "${dialog.type()}": "${dialog.message().substring(0,80)}"`);
    try { await dialog.accept(); } catch(e) {}
  });
  
  // Make input visible
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(500);
  
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { console.log('No input!'); process.exit(1); }
  
  // Check file info
  console.log('File size:', require('fs').statSync(filePath).size, 'bytes');
  
  await fileInput.setInputFiles(filePath);
  console.log('  setInputFiles done, waiting 30s...');
  await page.waitForTimeout(30000);
  
  // Check page state
  const buttons = await page.$$('button');
  console.log('All buttons:');
  for (const btn of buttons) {
    const t = await btn.innerText().catch(() => '');
    const disabled = await btn.getAttribute('disabled').catch(() => null);
    console.log(`  "${t.trim()}" disabled=${disabled}`);
  }
  
  // Check for file-related content
  const content = await page.content();
  const hasFile = content.includes('ai-agent-side-hustle-guide') || 
                  content.includes('BASIC') || 
                  content.includes('55') ||
                  content.includes('KB');
  console.log('File evidence:', hasFile);
  
  // Check console errors
  const consoleLogs = [];
  page.on('console', msg => { if(msg.type() === 'error') consoleLogs.push(msg.text()); });
  
  console.log('\n=== Done ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

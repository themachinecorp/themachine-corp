const { chromium } = require('playwright');

async function uploadAndPublish(page, productId, filePath) {
  const fileName = filePath.split('/').pop();
  console.log(`\n=== ${productId}: ${fileName} ===`);
  
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'domcontentloaded', timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  page.on('dialog', async dialog => {
    console.log(`  Dialog: "${dialog.type()}"`);
    try { await dialog.accept(); } catch(e) {}
  });
  
  // Make input visible + set files
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(300);
  
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { console.log('No input!'); return false; }
  
  await fileInput.setInputFiles(filePath);
  console.log(`  ✅ setInputFiles done`);
  
  // Wait for upload - poll until "Save and continue" button is enabled
  console.log('  Waiting for upload to complete...');
  let saved = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2000);
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const t = await btn.innerText().catch(() => '');
      const disabled = await btn.getAttribute('disabled').catch(() => null);
      if ((t.includes('Save') && t.includes('continue')) || t.includes('Publish')) {
        if (disabled === null || disabled === 'false') {
          await btn.click();
          console.log(`  ✅ Saved: ${productId} (after ${(i+1)*2}s)`);
          saved = true;
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    if (saved) break;
    console.log(`  Still waiting... (${(i+1)*2}s)`);
  }
  
  if (!saved) {
    console.log(`  ⚠️ Could not find enabled Save button`);
  }
  
  page.removeAllListeners('dialog');
  return saved;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  // First: retry fypiy (was waiting for button to enable)
  await uploadAndPublish(page, 'fypiy', '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md');
  
  // Second: retry hyvktm (was connection closed)
  await uploadAndPublish(page, 'hyvktm', '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf');
  
  console.log('\n=== Done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

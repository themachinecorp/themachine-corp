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
  
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(500);
  
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  console.log('  setInputFiles done, waiting for upload...');
  
  // Wait up to 60s for "Save and continue" to be clickable
  let saved = false;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(5000);
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const t = await btn.innerText().catch(() => '');
      if (t.includes('Save') && t.includes('continue')) {
        try {
          const isDisabled = await btn.isDisabled();
          console.log(`  Button disabled=${isDisabled}`);
          if (!isDisabled) {
            await btn.click();
            console.log(`  ✅ Saved: hyvktm (after ${(i+1)*5}s)`);
            saved = true;
            await page.waitForTimeout(3000);
            break;
          }
        } catch(e) {
          console.log(`  Button click error: ${e.message}`);
        }
      }
    }
    if (saved) break;
    console.log(`  Still waiting... (${(i+1)*5}s)`);
  }
  
  if (!saved) {
    console.log('  Trying force click...');
    try {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          if (btn.textContent.includes('Save') && btn.textContent.includes('continue')) {
            console.log('Found button via JS, clicking...');
            btn.disabled = false;
            btn.click();
            break;
          }
        }
      });
      await page.waitForTimeout(3000);
      console.log('  ✅ Force clicked Save');
    } catch(e) {
      console.log('  Force click failed:', e.message);
    }
  }
  
  console.log('\n=== Done ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

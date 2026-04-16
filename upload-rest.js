const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
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
  
  // Make input visible + set files directly
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(300);
  
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(filePath);
    console.log(`  ✅ setInputFiles done`);
    await page.waitForTimeout(8000);
  } else {
    console.log('  ❌ No input!'); return false;
  }
  
  // Find and click Save/Publish button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Save') && t.includes('continue')) {
      await btn.click();
      console.log(`  ✅ Saved: ${productId}`);
      await page.waitForTimeout(3000);
      break;
    }
  }
  
  page.removeAllListeners('dialog');
  return true;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  const PRODUCTS = [
    { id: 'fypiy',  file: '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md' },
    { id: 'okwae',  file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf' },
    { id: 'hyvktm', file: '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf' },
  ];
  
  for (const p of PRODUCTS) {
    try {
      await uploadProduct(page, p.id, p.file);
    } catch (e) {
      console.error(`  ❌ Error: ${e.message}`);
    }
  }
  
  console.log('\n=== All done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

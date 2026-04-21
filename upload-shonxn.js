const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  const productId = 'shonxn';
  const filePath = '/tmp/openclaw/uploads/50-Prompts-for-AI-Agent-Income.md';
  
  // Go to content tab
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'domcontentloaded', timeout: 20000 
  });
  await page.waitForTimeout(3000);
  
  // Setup dialog handler
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
    console.log(`  ✅ setInputFiles done for shonxn`);
    await page.waitForTimeout(8000);
  } else {
    console.log('  ❌ No file input!');
    process.exit(1);
  }
  
  // Check if file appeared in the content
  const content = await page.content();
  const hasFile = content.includes('50-Prompts') || content.includes('KB') || content.includes('bytes');
  console.log(`  File in page: ${hasFile ? 'YES' : 'checking...'}`);
  
  // Find Save changes button
  const saveBtn = await page.$('button:has-text("Save changes")');
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
    console.log('  ✅ Saved');
  }
  
  console.log('\n=== Done ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

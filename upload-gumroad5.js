const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  // Dismiss any dialogs first
  try {
    const dialog = page.context()._browser._browserVal.dialogs[0];
    if (dialog) await dialog.dismiss();
  } catch(e) {}
  
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2500);
  
  // Make file input visible
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:9999;display:block!important;visibility:visible!important;pointer-events:all!important';
      inp.removeAttribute('multiple');
    });
  });
  await page.waitForTimeout(300);
  
  // Click the file input to trigger any JS handlers
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) { console.log('No file input!'); return false; }
  
  // Try setInputFiles - this works when input is visible
  await fileInput.setInputFiles(filePath);
  console.log(`  setInputFiles done: ${filePath.split('/').pop()}`);
  await page.waitForTimeout(3000);
  
  // Check if a dialog appeared (Gumroad upload confirmation)
  try {
    page.context()._browser._browserVal.dialogs.length; // trigger
  } catch(e) {}
  
  // Dismiss any dialog
  try {
    const d = await page.context().waitForDialog({ timeout: 2000 }).catch(() => null);
    if (d) { await d.accept(); console.log('  Dialog accepted'); }
  } catch(e) { /* no dialog */ }
  
  // Now wait for file to appear in asset list
  await page.waitForTimeout(1000);
  
  // Check for any error messages
  const errorText = await page.evaluate(() => {
    const errs = document.querySelectorAll('[data-testid="error"], .error, .text-red-500');
    return Array.from(errs).map(e => e.innerText).join('; ');
  });
  if (errorText) console.log('  Errors:', errorText);
  
  // Try Publish button (look for both variations)
  const publishBtn = await page.$('button:has-text("Publish and continue")') ||
                    await page.$('button:has-text("Save changes")');
  if (publishBtn) {
    await publishBtn.click();
    await page.waitForTimeout(3000);
    console.log(`  ✅ Published: ${productId}`);
    return true;
  } else {
    console.log(`  ⚠️ No publish button for ${productId}`);
    return false;
  }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  const PRODUCTS = [
    { id: 'shonxn', file: '/tmp/openclaw/uploads/50-Prompts-for-AI-Agent-Income.md' },
    { id: 'vfxxtp', file: '/tmp/openclaw/uploads/Cold-Email-Swipe-File-for-AI-Agent-Income.md' },
    { id: 'fypiy',  file: '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md' },
    { id: 'okwae',  file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf' },
    { id: 'hyvktm', file: '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf' },
  ];
  
  for (const p of PRODUCTS) {
    try {
      await uploadProduct(page, p.id, p.file);
    } catch (e) {
      console.error(`Error with ${p.id}:`, e.message);
    }
  }
  
  console.log('\nAll done!');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

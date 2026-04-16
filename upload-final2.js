const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  const fileName = filePath.split('/').pop();
  console.log(`\n=== ${productId}: ${fileName} ===`);
  
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Setup dialog handler FIRST before anything else
  page.on('dialog', async dialog => {
    console.log(`  Dialog "${dialog.type()}": "${dialog.message().substring(0,80)}"`);
    try { await dialog.accept(); } 
    catch(e) { try { await dialog.dismiss(); } catch(e2) {} }
  });
  
  // Make file input visible
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(300);
  
  // Click Upload your files button
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Upload your files')) {
      await btn.click();
      console.log('  Clicked "Upload your files"');
      await page.waitForTimeout(1000);
      break;
    }
  }
  
  // Click "Computer files"
  const menuItems = await page.$$('[role="menuitem"]');
  console.log(`  Menu items found: ${menuItems.length}`);
  for (const mi of menuItems) {
    const t = await mi.innerText().catch(() => '');
    if (t.trim() === 'Computer files') {
      await mi.click();
      console.log('  Clicked "Computer files"');
      await page.waitForTimeout(500);
      break;
    }
  }
  
  // setInputFiles via Playwright CDP
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    try {
      await fileInput.setInputFiles(filePath);
      console.log(`  ✅ setInputFiles done`);
      await page.waitForTimeout(3000);
    } catch(e) {
      console.log(`  setInputFiles error: ${e.message}`);
    }
  } else {
    console.log('  ❌ No file input!');
    return false;
  }
  
  // Wait more for any upload processing
  await page.waitForTimeout(2000);
  
  // Try keyboard Enter to confirm upload if dialog appeared
  try {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  } catch(e) {}
  
  // Scroll to bottom of page to find Publish button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  // Look for Publish button
  const allButtons2 = await page.$$('button');
  let published = false;
  for (const btn of allButtons2) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Publish') || t.includes('Save changes')) {
      console.log(`  Found button: "${t.trim()}"`);
      await btn.click();
      await page.waitForTimeout(3000);
      console.log(`  ✅ Clicked: "${t.trim()}"`);
      published = true;
      break;
    }
  }
  
  if (!published) {
    console.log(`  ⚠️ No Publish/Save button found`);
  }
  
  // Remove dialog handler to prevent accumulation
  page.removeAllListeners('dialog');
  return published;
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
      const ok = await uploadProduct(page, p.id, p.file);
      console.log(`  Result: ${ok ? '✅ published' : '⚠️ needs check'}`);
    } catch (e) {
      console.error(`  ❌ Error: ${e.message}`);
    }
  }
  
  console.log('\n=== Done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

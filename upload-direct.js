const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  const fileName = filePath.split('/').pop();
  console.log(`\n=== ${productId}: ${fileName} ===`);
  
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Setup dialog handler FIRST
  page.on('dialog', async dialog => {
    console.log(`  Dialog "${dialog.type()}": "${dialog.message().substring(0,60)}"`);
    try { await dialog.accept(); } 
    catch(e) { try { await dialog.dismiss(); } catch(e2) {} }
  });
  
  // Find ALL file inputs (including hidden ones) and make them visible + set files
  // Don't click any buttons - just directly manipulate the hidden input
  await page.evaluate((fp) => {
    const inputs = document.querySelectorAll('input[type="file"]');
    console.log('File inputs found:', inputs.length);
    inputs.forEach(inp => {
      console.log('Input:', inp.style.cssText, inp.className, inp.offsetParent !== null ? 'visible' : 'hidden');
      // Make visible
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
    return inputs.length;
  });
  
  await page.waitForTimeout(500);
  
  // Now directly set files on the FIRST input (the visible one)
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    try {
      await fileInput.setInputFiles(filePath);
      console.log(`  ✅ setInputFiles done`);
      // Wait for upload to complete - this is the key!
      await page.waitForTimeout(8000);
    } catch(e) {
      console.log(`  setInputFiles error: ${e.message}`);
    }
  } else {
    console.log('  ❌ No file input!');
    return false;
  }
  
  // Check if file appeared
  const pageContent = await page.content();
  const hasFile = pageContent.includes('.md') || pageContent.includes('.pdf') || 
                  pageContent.includes('bytes') || pageContent.includes('KB') ||
                  pageContent.includes('Upload') === false; // looking for asset list
  console.log(`  Page has file content: ${hasFile}`);
  
  // Now find and click Publish button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Publish') || (t.includes('Save') && t.includes('continue'))) {
      console.log(`  Clicking: "${t.trim()}"`);
      await btn.click();
      await page.waitForTimeout(4000);
      console.log(`  ✅ Done`);
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
      console.error(`  ❌ Error: ${e.message}`);
    }
  }
  
  console.log('\n=== All done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

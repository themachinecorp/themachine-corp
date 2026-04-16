const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  const fileName = filePath.split('/').pop();
  console.log(`\n=== ${productId}: ${fileName} ===`);
  
  // Navigate
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Handle any dialog that might appear
  let dialogHandled = false;
  const dialogHandler = async dialog => {
    console.log(`  Dialog: "${dialog.type()}" - "${dialog.message().substring(0,50)}"`);
    dialogHandled = true;
    try { await dialog.accept(); } 
    catch(e) { try { await dialog.dismiss(); } catch(e2) {} }
  };
  page.on('dialog', dialogHandler);
  
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
  const uploadBtns = await page.$$('button');
  for (const btn of uploadBtns) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Upload your files')) {
      await btn.click();
      console.log('  Clicked "Upload your files"');
      await page.waitForTimeout(800);
      break;
    }
  }
  
  // Click "Computer files" in dialog
  const menuItems = await page.$$('[role="menuitem"]');
  console.log(`  Menu items: ${menuItems.length}`);
  for (const mi of menuItems) {
    const t = await mi.innerText().catch(() => '');
    if (t.trim() === 'Computer files') {
      await mi.click();
      console.log('  Clicked "Computer files"');
      await page.waitForTimeout(300);
      break;
    }
  }
  
  // Now setInputFiles via Playwright (uses CDP)
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
    console.log('  ❌ No file input found!');
  }
  
  // Check for any new dialogs
  if (dialogHandled) console.log('  Dialog was handled');
  
  // Check if file appears
  const pageContent = await page.content();
  const hasUpload = pageContent.includes('.md') || pageContent.includes('.pdf') || pageContent.includes('bytes') || pageContent.includes('KB');
  console.log(`  File evidence in page: ${hasUpload ? 'YES' : 'checking...'}`);
  
  // Try to publish
  await page.waitForTimeout(1000);
  const publishBtn = await page.$('button:has-text("Publish and continue")');
  if (publishBtn) {
    await publishBtn.click();
    await page.waitForTimeout(3000);
    console.log(`  ✅ Published: ${productId}`);
  } else {
    // Try Save changes
    const saveBtn = await page.$('button:has-text("Save changes")');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log(`  💾 Saved: ${productId}`);
    } else {
      console.log(`  ⚠️ No publish/save button found`);
    }
  }
  
  page.off('dialog', dialogHandler);
  return true;
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected to browser CDP');
  
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
  
  console.log('\n=== All done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

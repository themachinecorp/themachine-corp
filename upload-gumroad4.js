const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Make file input visible by removing hiding styles
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:9999;display:block!important;visibility:visible!important;pointer-events:all!important';
      inp.removeAttribute('multiple');
    });
  });
  await page.waitForTimeout(500);
  
  // Now use Playwright's setInputFiles - works with visible inputs
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(filePath);
    console.log(`✅ File set: ${productId} - ${filePath.split('/').pop()}`);
    await page.waitForTimeout(3000);
  } else {
    console.log(`❌ No file input found for ${productId}`);
  }
  
  // Publish
  try {
    const publishBtn = page.locator('button:has-text("Publish and continue")');
    if (await publishBtn.count() > 0) {
      await publishBtn.click();
      await page.waitForTimeout(3000);
      console.log(`✅ Published: ${productId}`);
    } else {
      console.log(`⚠️ No publish button for ${productId}`);
    }
  } catch (e) {
    console.log(`Error publishing ${productId}:`, e.message);
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
    {id: 'okwae',  file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf' },
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

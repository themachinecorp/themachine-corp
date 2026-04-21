const { chromium } = require('playwright');

async function uploadProduct(page, productId, filePath) {
  // Navigate
  await page.goto(`https://gumroad.com/products/${productId}/edit#content`, { 
    waitUntil: 'networkidle', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Check buttons on page
  const allButtons = await page.$$('button');
  console.log('Buttons on page:', allButtons.length);
  for (const btn of allButtons.slice(0, 5)) {
    const t = await btn.innerText().catch(() => '');
    const cls = await btn.getAttribute('class').catch(() => '');
    console.log('  BTN:', t.trim().substring(0, 50), '|', cls.substring(0, 50));
  }
  
  // Try CDP approach to setInputFiles - get CDPSession properly
  const cdpSession = await page.context().newCDPSession(page);
  
  // Find file input via CDP
  const { root } = await cdpSession.send('DOM.getDocument');
  const { nodeIds } = await cdpSession.send('DOM.querySelectorAll', { 
    selector: 'input[type="file"]', nodeId: root.nodeId 
  });
  
  console.log('File inputs found via CDP:', nodeIds.length);
  
  if (nodeIds.length > 0) {
    const fileNodeId = nodeIds[0];
    
    // Set files via CDP
    await cdpSession.send('DOM.setInputFiles', {
      nodeId: fileNodeId,
      files: [filePath]
    });
    console.log('CDP setInputFiles sent!');
    
    await page.waitForTimeout(4000);
  } else {
    console.log('No file inputs found!');
  }
  
  await cdpSession.detach();
  
  // Now try to click Publish
  const publishBtn = await page.$('button:has-text("Publish and continue")');
  if (publishBtn) {
    await publishBtn.click();
    await page.waitForTimeout(3000);
    console.log('Clicked Publish');
  }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = (await ctx.pages())[0];
  console.log('Connected. Page:', page.url());
  
  await uploadProduct(page, 'shonxn', '/tmp/openclaw/uploads/50-Prompts-for-AI-Agent-Income.md');
  await uploadProduct(page, 'vfxxtp', '/tmp/openclaw/uploads/Cold-Email-Swipe-File-for-AI-Agent-Income.md');
  await uploadProduct(page, 'fypiy', '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md');
  await uploadProduct(page, 'okwae', '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf');
  await uploadProduct(page, 'hyvktm', '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf');
  
  console.log('\nAll done!');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message, e.stack); process.exit(1); });

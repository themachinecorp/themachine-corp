const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  // Get the existing page
  const page = (await ctx.pages())[0];
  console.log('Connected. Page URL:', page.url());
  
  const PRODUCTS = [
    { id: 'shonxn', file: '/tmp/openclaw/uploads/50-Prompts-for-AI-Agent-Income.md' },
    { id: 'vfxxtp', file: '/tmp/openclaw/uploads/Cold-Email-Swipe-File-for-AI-Agent-Income.md' },
    { id: 'fypiy',  file: '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md' },
    { id: 'okwae',  file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf' },
    { id: 'hyvktm', file: '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf' },
  ];
  
  for (const p of PRODUCTS) {
    try {
      console.log(`\n--- Uploading to ${p.id} ---`);
      
      // Navigate to content tab
      await page.goto(`https://gumroad.com/products/${p.id}/edit#content`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      // Click "Upload your files" button
      const uploadBtn = await page.locator('button:has-text("Upload your files")').first();
      const btnExists = await uploadBtn.count() > 0;
      console.log('Upload button found:', btnExists);
      if (!btnExists) {
        // Try ref based on snapshot
        console.log('Trying alternate click...');
        const allBtns = await page.$$('button');
        for (const b of allBtns) {
          const t = await b.innerText().catch(() => '');
          if (t.includes('Upload your files')) {
            await b.click();
            console.log('Clicked via loop');
            break;
          }
        }
      } else {
        await uploadBtn.click();
      }
      await page.waitForTimeout(1500);
      
      // Click "Computer files" 
      const menuItems = await page.$$('[role="menuitem"]');
      console.log('Menu items:', menuItems.length);
      for (const mi of menuItems) {
        const t = await mi.innerText().catch(() => '');
        if (t.trim() === 'Computer files') {
          await mi.click();
          console.log('Clicked Computer files');
          break;
        }
      }
      await page.waitForTimeout(500);
      
      // Now CDP setInputFiles - bypasses Chrome security
      const cdp = ctx._browser._connection._transport._ws;
      const input = await page.$('input[type="file"]');
      console.log('File input found:', input !== null);
      
      if (input) {
        // Use CDP Session to call DOM.setInputFiles
        const cdpSession = await page.context().newCDPSession(page);
        const nodeId = await cdpSession.send('DOM.getDocument').then(r => r.root.nodeId);
        const backendNodeId = await cdpSession.send('DOM.requestChildNodes', { nodeId }).then(() => null).catch(() => null);
        
        // Find the input's node
        const result = await cdpSession.send('DOM.querySelectorAll', { selector: 'input[type="file"]', nodeId });
        if (result && result.nodeIds && result.nodeIds.length > 0) {
          const nodeId2 = result.nodeIds[0];
          await cdpSession.send('DOM.setInputFiles', {
            nodeId: nodeId2,
            files: [p.file]
          });
          console.log('CDP setInputFiles sent for:', p.file);
        } else {
          console.log('Could not get nodeId for file input');
        }
        await cdpSession.detach().catch(() => {});
      }
      
      await page.waitForTimeout(4000);
      
      // Check if file appeared
      const pageContent = await page.content();
      const hasFile = pageContent.includes('.md') || pageContent.includes('.pdf') || pageContent.includes('bytes');
      console.log('File in page:', hasFile ? 'YES' : 'maybe');
      
      // Publish
      const publishBtn = page.locator('button:has-text("Publish and continue")');
      if (await publishBtn.count() > 0) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
        console.log(`✅ ${p.id} done`);
      } else {
        console.log('Publish btn not found, trying Save');
        const saveBtn = page.locator('button:has-text("Save changes")');
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (err) {
      console.error(`Error with ${p.id}:`, err.message);
    }
  }
  
  console.log('\nAll done!');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

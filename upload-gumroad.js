const { chromium } = require('playwright');

const PRODUCTS = [
  { id: 'shonxn', file: '/tmp/openclaw/uploads/50-Prompts-for-AI-Agent-Income.md', name: '50 Prompts for AI Agent Income' },
  { id: 'vfxxtp', file: '/tmp/openclaw/uploads/Cold-Email-Swipe-File-for-AI-Agent-Income.md', name: 'Cold Email Swipe File' },
  { id: 'fypiy', file: '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md', name: 'AI Agent Side Hustle Dashboard' },
  { id: 'okwae', file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf', name: 'AI Agent Engineer Playbook' },
  { id: 'hyvktm', file: '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf', name: 'AI Agent Side Hustle Guide Basic' },
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const ctx = browser.contexts()[0];
  const page = ctx.pages()[0];
  
  console.log('Browser connected. Page URL:', page.url());

  for (const product of PRODUCTS) {
    try {
      console.log(`\n=== ${product.name} (${product.id}) ===`);
      
      await page.goto(`https://gumroad.com/products/${product.id}/edit#content`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Click Content tab
      const tabs = await page.$$('tab');
      for (const tab of tabs) {
        const txt = await tab.innerText().catch(() => '');
        if (txt.trim() === 'Content') {
          const selected = await tab.getAttribute('aria-selected').catch(() => 'false');
          if (selected !== 'true') {
            await tab.click();
            await page.waitForTimeout(1000);
          }
          break;
        }
      }
      
      // Wait for Upload button to appear
      await page.waitForTimeout(1000);
      
      // Click Upload your files button (the one inside the dialog or before dialog)
      const allButtons = await page.$$('button');
      let uploadBtn = null;
      for (const btn of allButtons) {
        const txt = await btn.innerText().catch(() => '');
        if (txt.includes('Upload your files')) {
          uploadBtn = btn;
          break;
        }
      }
      
      if (uploadBtn) {
        console.log('Found Upload button, clicking...');
        await uploadBtn.click();
        await page.waitForTimeout(1000);
      } else {
        console.log('Upload button not found');
      }
      
      // Click "Computer files" menuitem in dialog
      const menuItems = await page.$$('[role="menuitem"]');
      console.log('Menu items found:', menuItems.length);
      for (const item of menuItems) {
        const txt = await item.innerText().catch(() => '');
        if (txt.trim() === 'Computer files') {
          console.log('Clicking Computer files...');
          await item.click();
          await page.waitForTimeout(500);
          break;
        }
      }
      
      // Now use CDP setInputFiles on file input
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log('Setting files on input via CDP...');
        await fileInput.setInputFiles(product.file);
        await page.waitForTimeout(3000);
        console.log('File set, waiting for upload...');
      } else {
        console.log('ERROR: file input not found');
      }
      
      // Check page state after upload
      const bodyText = await page.innerText('body');
      const hasFile = bodyText.includes('.md') || bodyText.includes('.pdf') || bodyText.includes('KB');
      console.log('File upload evidence found:', hasFile ? 'YES' : 'checking...');
      
      // Click Publish button
      const publishBtn = await page.$('button:has-text("Publish and continue")') || 
                         await page.$('button:has-text("Save and continue")');
      if (publishBtn) {
        console.log('Clicking Publish...');
        await publishBtn.click();
        await page.waitForTimeout(3000);
        console.log(`✅ Done: ${product.name}`);
      } else {
        console.log('Publish button not found, trying to save...');
        const saveBtn = await page.$('button:has-text("Save changes")');
        if (saveBtn) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
        }
      }
      
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n=== All products processed ===');
  await browser.close();
})().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });

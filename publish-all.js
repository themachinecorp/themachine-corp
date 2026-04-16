const { chromium } = require('playwright');

const PRODUCTS = [
  {
    id: 'vfxxtp',
    name: 'Cold Email Swipe File',
    price: '$14',
    description: '50 proven cold email templates for AI agent services. Includes scripts for reaching decision-makers, follow-up sequences, objection handling, and closing templates. Used by freelancers who charge $500+/project.',
    summary: '50 proven cold email templates for AI agent services. Covers outreach, follow-ups, objection handling, and closing.',
    file: '/tmp/openclaw/uploads/Cold-Email-Swipe-File-for-AI-Agent-Income.md'
  },
  {
    id: 'fypiy',
    name: 'AI Agent Side Hustle Dashboard',
    price: '$19',
    description: 'Notion template for tracking your AI agent income. Includes monthly income tracker, client pipeline, task log, and analytics dashboard. Copy and paste setup in 5 minutes.',
    summary: 'Notion template for tracking AI agent income. Includes monthly tracker, client pipeline, task log, and analytics.',
    file: '/tmp/openclaw/uploads/AI-Agent-Side-Hustle-Dashboard-Notion-Template.md'
  },
  {
    id: 'okwae',
    name: 'AI Agent Engineer Playbook',
    price: '$59',
    description: 'Complete playbook for building and selling AI agent services. Covers: finding clients, pricing strategies, proposal templates, delivery frameworks, and scaling to $5K/month. Based on real $10K+/month operations.',
    summary: 'Complete playbook for building and selling AI agent services. Real strategies from $5K/month operations.',
    file: '/tmp/openclaw/uploads/AI-Agent-Engineer-Playbook.pdf'
  },
  {
    id: 'hyvktm',
    name: 'AI Agent Side Hustle Guide Basic',
    price: '$9',
    description: 'The no-nonsense guide to starting your first AI agent side hustle. Covers finding your first client, delivering quality work fast, and getting repeat business. Perfect for beginners.',
    summary: 'Guide to starting your first AI agent side hustle. Find clients, deliver fast, get repeat business.',
    file: '/tmp/openclaw/uploads/ai-agent-side-hustle-guide-BASIC.pdf'
  }
];

async function publishProduct(page, product) {
  const { id, name, description, summary, file } = product;
  const fileName = file.split('/').pop();
  console.log(`\n=== ${name} (${id}) ===`);
  
  // Navigate to Product tab
  await page.goto(`https://gumroad.com/products/${id}/edit`, { 
    waitUntil: 'domcontentloaded', timeout: 20000 
  });
  await page.waitForTimeout(2000);
  
  // Setup dialog handler
  page.on('dialog', async dialog => {
    console.log(`  Dialog: "${dialog.type()}"`);
    try { await dialog.accept(); } catch(e) {}
  });
  
  // Fill description (Tiptap ProseMirror editor)
  await page.evaluate(() => {
    const editor = document.querySelector('.tiptap.ProseMirror');
    if (editor) {
      editor.focus();
      document.execCommand('selectAll');
      document.execCommand('insertText', false, arguments[0]);
    }
  }, description);
  console.log(`  Description filled`);
  await page.waitForTimeout(500);
  
  // Make file input visible + upload
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(inp => {
      inp.removeAttribute('multiple');
      inp.style.cssText = 'position:fixed;top:0;left:0;width:300px;height:80px;opacity:1;z-index:99999;display:block!important;visibility:visible!important;pointer-events:all!important';
    });
  });
  await page.waitForTimeout(300);
  
  // Click Upload your files
  const uploadBtns = await page.$$('button');
  for (const btn of uploadBtns) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Upload your files')) {
      await btn.click();
      console.log(`  Clicked Upload your files`);
      await page.waitForTimeout(1000);
      break;
    }
  }
  
  // Click Computer files
  const menuItems = await page.$$('[role="menuitem"]');
  for (const mi of menuItems) {
    const t = await mi.innerText().catch(() => '');
    if (t.trim() === 'Computer files') {
      await mi.click();
      console.log(`  Clicked Computer files`);
      await page.waitForTimeout(300);
      break;
    }
  }
  
  // Upload file via CDP
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    try {
      await fileInput.setInputFiles(file);
      console.log(`  ✅ File uploaded: ${fileName}`);
      await page.waitForTimeout(8000);
    } catch(e) {
      console.log(`  Upload error: ${e.message}`);
    }
  } else {
    console.log(`  ❌ No file input found`);
  }
  
  // Click Save and continue / Save changes
  await page.waitForTimeout(1000);
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const t = await btn.innerText().catch(() => '');
    if (t.includes('Save and continue') || t.includes('Save changes')) {
      await btn.click();
      console.log(`  ✅ Saved`);
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
  console.log('Connected. Starting bulk publish...');
  
  for (const p of PRODUCTS) {
    try {
      await publishProduct(page, p);
    } catch (e) {
      console.error(`  ❌ Error with ${p.id}:`, e.message);
    }
  }
  
  console.log('\n=== All done! ===');
  await browser.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

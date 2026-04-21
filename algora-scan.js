const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  console.log('🔍 Full bounties page scan...');
  await p.goto('https://algora.io/bounties', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(10000);
  
  // Get ALL text from the page
  const bodyText = await p.evaluate(() => document.body.innerText);
  
  // Split into lines and find bounty entries
  const lines = bodyText.split('\n');
  let inBounty = false;
  let currentBounty = {};
  let bounties = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for dollar amounts that are likely bounties
    if (line.match(/^\$\d/) || line.match(/^\$[\d,]+$/)) {
      const amount = line.match(/^\$[\d,]+$/)?.[0];
      if (amount) {
        const amountNum = parseInt(amount.replace(/[$,]/g, ''));
        if (amountNum >= 500) {
          // Get surrounding context
          const context = lines.slice(Math.max(0, i-5), i+10).join('\n');
          bounties.push({ amount, context: context.substring(0, 300) });
        }
      }
    }
  }
  
  console.log(`Found ${bounties.length} $500+ bounties:`);
  bounties.forEach((b, i) => {
    console.log(`\n--- Bounty ${i+1}: ${b.amount} ---`);
    console.log(b.context);
  });
  
  await b.close();
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

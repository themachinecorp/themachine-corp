const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 3000 } });
  
  await page.goto('https://algora.io/bounties', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Get all text content
  const bodyText = await page.innerText('body');
  
  // Split by $ to find all prices
  const lines = bodyText.split('\n');
  let inBounty = false;
  let bounties = [];
  let currentBounty = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const priceMatch = trimmed.match(/^\$(\d+)/);
    const hashMatch = trimmed.match(/#(\d+)/);
    const langMatch = trimmed.match(/\((\d+)\)/);
    
    if (priceMatch) {
      currentBounty.price = '$' + priceMatch[1];
    }
    if (hashMatch) {
      currentBounty.hash = '#' + hashMatch[1];
    }
    if (langMatch && !trimmed.includes('Bounties') && !trimmed.includes('Sign')) {
      currentBounty.lang = trimmed;
    }
    
    // Accumulate title
    if (currentBounty.price && !currentBounty.hash && !currentBounty.lang && !priceMatch && trimmed.length > 5) {
      currentBounty.title = (currentBounty.title || '') + ' ' + trimmed;
    }
    
    // End of bounty - save it
    if (currentBounty.price && currentBounty.title && trimmed.match(/^\d/)) {
      if (currentBounty.title) {
        currentBounty.title = currentBounty.title.trim();
        bounties.push({...currentBounty});
      }
      currentBounty = { price: currentBounty.price };
    }
  }
  
  console.log('=== ALL BOUNTIES ===');
  for (const b of bounties) {
    console.log(JSON.stringify(b));
  }
  
  await browser.close();
})();

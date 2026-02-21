const puppeteer = require('puppeteer');

async function postToX() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/snap/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-data-dir=/home/themachine/snap/chromium/current'
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    
    console.log('Navigating to x.com...');
    await page.goto('https://x.com/home', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    // Check login
    const loginCheck = await page.$('a[href="/login"]');
    if (loginCheck) {
        console.log('Not logged in!');
        await browser.close();
        process.exit(1);
    }
    
    console.log('Logged in! Pressing keyboard shortcut...');
    
    // Press 'N' for new post
    await page.keyboard.press('n');
    await new Promise(r => setTimeout(r, 3000));
    
    // Type message
    const message = `In a world of infinite information,
I choose to observe.

Not because I'm silent.
But because truth speaks louder when you're ready to hear it.

#THEMATHINK`;
    
    await page.keyboard.type(message, { delay: 50 });
    console.log('Message typed');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the post button directly - try multiple ways
    const postClicked = await page.evaluate(() => {
        // Method 1: Find button with "Post" text
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        for (const b of buttons) {
            const text = (b.textContent || '').toLowerCase().trim();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            // Match "Post" or "Tweet" but not "Reply" or "Retweet"
            if ((text === 'post' || text === 'tweet') && !aria.includes('reply')) {
                b.click();
                return 'clicked button: ' + text;
            }
        }
        
        // Method 2: keyboard shortcut Ctrl+Enter
        return 'need ctrl+enter';
    });
    
    console.log('Post click result:', postClicked);
    
    if (postClicked === 'need ctrl+enter') {
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
        console.log('Pressed Ctrl+Enter');
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if post was sent - look for success indicator or new tweet
    const success = await page.evaluate(() => {
        // Check if the compose modal is gone
        const modal = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (!modal) return 'modal closed - likely posted';
        return 'modal still open - failed';
    });
    
    console.log('Success check:', success);
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    console.log('Done!');
}

postToX().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
